namespace Sorveteria.Api.Dtos;

public record UpsertProductRequest(
    string Name,
    string Category,
    string? Description,
    bool IsActive,
    bool CountsForCampaign,
    int BasePoints,
    decimal UnitPrice
);
