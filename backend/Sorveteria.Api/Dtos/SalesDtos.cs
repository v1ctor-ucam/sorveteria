namespace Sorveteria.Api.Dtos;

public record CreateSaleItemRequest(Guid ProductId, int Quantity);

public record CreateSaleRequest(
    Guid EmployeeId,
    decimal? TotalAmount,
    List<CreateSaleItemRequest> Items
);

public record CreateSaleResponse(
    Guid SaleId,
    string QrToken,
    DateTime ExpiresAtUtc
);

public record LinkSaleByQrRequest(string QrToken);
