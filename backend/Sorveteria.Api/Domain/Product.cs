namespace Sorveteria.Api.Domain;

public class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Outros";
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool CountsForCampaign { get; set; } = true;
    public int BasePoints { get; set; }
    public decimal UnitPrice { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<SaleItem> SaleItems { get; set; } = [];
}
