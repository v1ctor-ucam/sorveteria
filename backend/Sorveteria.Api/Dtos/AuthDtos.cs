namespace Sorveteria.Api.Dtos;

public record RegisterCustomerRequest(
    string FullName,
    string Email,
    string Phone,
    string Password
);

public record LoginRequest(
    string Login,
    string Password
);

public record AuthResponse(
    string Token,
    DateTime ExpiresAtUtc,
    string Role
);
