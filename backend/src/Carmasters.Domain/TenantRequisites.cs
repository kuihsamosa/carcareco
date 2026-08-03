using System;

namespace Carmasters.Core.Domain
{
    public class TenantRequisites : GuidIdentityEntity
    {
        public virtual string Name { get; protected set; }
        public virtual string Phone { get; protected set; }
        public virtual string Address { get; protected set; }
        public virtual string Email { get; protected set; }
        public virtual string BankAccount { get; protected set; }
        public virtual string RegNr { get; protected set; }
        public virtual string KMKR { get; protected set; }
        public virtual string Tagline { get; protected set; }
        public virtual string Website { get; protected set; }
        public virtual string Address2 { get; protected set; }
        public virtual string City { get; protected set; }
        public virtual string Postcode { get; protected set; }
        public virtual string State { get; protected set; }
        public virtual string Country { get; protected set; }
        public virtual string Currency { get; protected set; }
        public virtual byte[] Logo { get; protected set; }
        public virtual string LogoContentType { get; protected set; }
        public virtual DateTime CreatedAt { get; protected set; }
        public virtual DateTime UpdatedAt { get; protected set; }

        protected TenantRequisites() { }

        public TenantRequisites(
            string name,
            string phone,
            string address,
            string email,
            string bankAccount,
            string regNr,
            string kmkr,
            Guid? id = null)
        {
            Id = id.GetValueOrDefault();
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Phone = phone;
            Address = address;
            Email = email;
            BankAccount = bankAccount;
            RegNr = regNr;
            KMKR = kmkr;
            Currency = "MYR";
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public virtual void Update(
            string name,
            string phone,
            string address,
            string email,
            string bankAccount,
            string regNr,
            string kmkr)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Phone = phone;
            Address = address;
            Email = email;
            BankAccount = bankAccount;
            RegNr = regNr;
            KMKR = kmkr;
            UpdatedAt = DateTime.UtcNow;
        }

        public virtual void UpdateProfile(
            string name,
            string tagline,
            string phone,
            string email,
            string website,
            string address,
            string address2,
            string city,
            string postcode,
            string state,
            string country,
            string bankAccount,
            string regNr,
            string kmkr,
            string currency,
            byte[] logo,
            string logoContentType)
        {
            Name = name ?? throw new ArgumentNullException(nameof(name));
            Tagline = tagline;
            Phone = phone;
            Email = email;
            Website = website;
            Address = address;
            Address2 = address2;
            City = city;
            Postcode = postcode;
            State = state;
            Country = country;
            BankAccount = bankAccount;
            RegNr = regNr;
            KMKR = kmkr;
            Currency = currency ?? "MYR";
            Logo = logo;
            LogoContentType = logoContentType;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
