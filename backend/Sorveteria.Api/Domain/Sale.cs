namespace Sorveteria.Api.Domain;

public class Sale
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = default!;
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public decimal? TotalAmount { get; set; }
    public SaleStatus Status { get; set; } = SaleStatus.PendingLink;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? LinkedAtUtc { get; set; }
    public string QrToken { get; set; } = string.Empty;
    public string? LinkIpAddress { get; set; }

    public List<SaleItem> Items { get; set; } = [];
}
