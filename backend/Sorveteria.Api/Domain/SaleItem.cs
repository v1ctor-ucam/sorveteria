namespace Sorveteria.Api.Domain;

public class SaleItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SaleId { get; set; }
    public Sale Sale { get; set; } = default!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = default!;
    public int Quantity { get; set; }
    public int ItemPoints { get; set; }
    public decimal UnitPriceSnapshot { get; set; }
}
