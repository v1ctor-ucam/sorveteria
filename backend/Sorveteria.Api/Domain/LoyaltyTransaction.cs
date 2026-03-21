namespace Sorveteria.Api.Domain;

public class LoyaltyTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = default!;
    public Guid? SaleId { get; set; }
    public Sale? Sale { get; set; }
    public Guid? CampaignRuleId { get; set; }
    public CampaignRule? CampaignRule { get; set; }
    public int Points { get; set; }
    public LoyaltyTransactionType Type { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
