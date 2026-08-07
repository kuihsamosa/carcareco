FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish Carmasters.Http.Api/Carmasters.Http.Api.csproj -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

# Chromium for PuppeteerSharp's PDF rendering. It is baked into the image
# rather than fetched by BrowserFetcher at startup: the container filesystem is
# ephemeral, so a runtime download would repeat on every cold start, and the
# downloaded browser would still fail to launch without these shared libraries.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        fonts-liberation \
        fonts-dejavu-core \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Directories the PDF generator writes to. Without these the generator throws
# DirectoryNotFoundException *after* rendering, turning a good PDF into a 500.
RUN mkdir -p /var/carcare/pdf /opt/puppeteer

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY --from=build /app/out .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
CMD ["dotnet", "Carmasters.Http.Api.dll"]
