using System;
using Carmasters.Core.Application.Configuration;
using Carmasters.Core.Application.Database;
using Carmasters.Core.Application.Services;
using Carmasters.Core.Domain;
using Carmasters.Core.Persistence.Postgres;
using Carmasters.Core.Persistence.Postgres.NHibernate;
using Carmasters.Core.Persistence.Postgres.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using NHibernate;
using NHibernate.Mapping;
using System;
using System.Data.Common;
using System.Reflection;

namespace Carmasters.Core.Repository.Postgres
{
    public static class DependencyInjectionExtensions
    {
        static object lockObj = new object();
        public static IServiceCollection AddPersistanceServices(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionBuilder = new Npgsql.NpgsqlConnectionStringBuilder();
            var options = new DbOptions(); configuration.GetSection("DbOptions").Bind(options);
            // Railway Raw Editor bug: all vars got concatenated into DbOptions__Host value.
            // Extract just the hostname (everything before the first quote or newline).
            var rawHost = options.Host ?? string.Empty;
            var cleanHost = rawHost.Split(new[] { '"', '\n', '\r' }, 2)[0].Trim();
            Console.WriteLine($"[DB CONFIG] RawHost len={rawHost.Length} CleanHost='{cleanHost}' Port={options.Port} User={options.UserId} DB={options.Name}");
            connectionBuilder.Host = cleanHost;
            connectionBuilder.Port = options.Port;
            connectionBuilder.Username = options.UserId;
            connectionBuilder.Password = options.Password;
            connectionBuilder.Database = options.Name;
            connectionBuilder.SslMode = Npgsql.SslMode.Require;
            connectionBuilder.TrustServerCertificate = true;
            // Fail fast instead of hanging forever when the DB/pooler is unreachable,
            // and keep the pool small to respect Supabase's pooler connection limits.
            connectionBuilder.Timeout = 15;            // connection open timeout (s)
            connectionBuilder.CommandTimeout = 30;     // query timeout (s)
            connectionBuilder.MaxPoolSize = 5;
            connectionBuilder.MinPoolSize = 0;
            connectionBuilder.KeepAlive = 30;
            connectionBuilder.IncludeErrorDetail = true;
            Console.WriteLine($"[DB CONFIG] NHibernate connection string ready: Host={connectionBuilder.Host} Port={connectionBuilder.Port} DB={connectionBuilder.Database} Ssl={connectionBuilder.SslMode} Timeout={connectionBuilder.Timeout} MaxPool={connectionBuilder.MaxPoolSize}");
            var multitenancyEnabled = options.MultiTenancy?.Enabled == true;
            var defaultFactory = default(ISessionFactory);
            var mappingAssemblies = new System.Collections.Generic.List<Assembly>() { typeof(UserDbMapping).Assembly };
            if (multitenancyEnabled)
            {
                connectionBuilder.Database = new MultiTenancyDbName(options, DbKind.Tenancy);
                defaultFactory = NNhibernateFactory.BuildSessionFactory(mappingAssemblies, connectionBuilder.ToString());
            }
            else 
            {
                mappingAssemblies.Add(typeof(WorkMapping).Assembly);
                defaultFactory = NNhibernateFactory.BuildSessionFactory(mappingAssemblies, connectionBuilder.ToString());
            }        

            var appFactory = default(ISessionFactory);
            
            services.AddScoped<IUserRepository>(x => {
                return new UserRepository(x.GetRequiredService<IOptions<DbOptions>>());
            });
            services.AddScoped<ISession>(x =>{

                if (!multitenancyEnabled) return defaultFactory.OpenSession();

                var user = x.GetRequiredService<Microsoft.AspNetCore.Http.IHttpContextAccessor>().HttpContext.User;
                if (user.Identity.IsAuthenticated) 
                {
                    if (appFactory == null)
                    {
                        lock (lockObj)
                        {
                            if (appFactory == null) //double if, if anyone was waiting it might have been initialized already
                            {
                                appFactory = NNhibernateFactory.BuildSessionFactory(new System.Collections.Generic.List<Assembly>() { typeof(WorkMapping).Assembly });
                            }
                        }
                    } 
                    return appFactory.OpenSession();
                }
                throw new System.Exception("Unable to open database session, user not authenticated.");
            });


            services.AddScoped<IRepository, GenericRepository>();
          
            services.AddScoped<ISequnceNumberProviderFactory, SequenceNumberProviderFactory>();
            services.AddScoped<InvoiceSequenceNumberProvider>();
            services.AddScoped<WorkSequenceNumberProvider>();
            services.AddScoped<EstimateSequenceNumberProvider>(); 
            services.AddScoped<UnitOfWorkAspect>();
            services.AddSingleton<DbConnectionProvider>();
            services.AddScoped<DbConnection>(x => new Npgsql.NpgsqlConnection());
            services.AddSingleton<MultiTenancyConnectionDriver>();
            services.AddSingleton<DatabaseBackup>();
            services.AddScoped<ITenancyRepository, TenancyRepository>();
            return services;
        }
    }
     
}