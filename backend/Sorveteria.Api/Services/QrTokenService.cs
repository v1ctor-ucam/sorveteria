using Microsoft.Extensions.Options;

namespace Sorveteria.Api.Services;

public class QrTokenService(IOptions<QrCodeOptions> qrCodeOptions)
{
    private readonly QrCodeOptions _options = qrCodeOptions.Value;

    public string GenerateToken()
    {
        return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
            .Replace("=", string.Empty)
            .Replace("+", "-")
            .Replace("/", "_");
    }

    public DateTime GenerateExpirationUtc()
    {
        return DateTime.UtcNow.AddMinutes(_options.TokenMinutes);
    }
}
