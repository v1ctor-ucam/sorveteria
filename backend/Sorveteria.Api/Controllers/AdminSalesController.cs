using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sorveteria.Api.Data;
using Sorveteria.Api.Domain;
using Sorveteria.Api.Dtos;
using Sorveteria.Api.Services;

namespace Sorveteria.Api.Controllers;

[ApiController]
[Route("api/admin/sales")]
[Authorize(Roles = nameof(UserRole.Admin) + "," + nameof(UserRole.Employee))]
public class AdminSalesController(AppDbContext dbContext, QrTokenService qrTokenService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<CreateSaleResponse>> CreateSale(CreateSaleRequest request)
    {
        var employee = await dbContext.Employees.FirstOrDefaultAsync(x => x.Id == request.EmployeeId && x.IsActive);
        if (employee is null)
        {
            return BadRequest("Funcionario invalido.");
        }

        var productIds = request.Items.Select(x => x.ProductId).Distinct().ToList();
        var products = await dbContext.Products.Where(x => productIds.Contains(x.Id) && x.IsActive).ToListAsync();

        if (products.Count != productIds.Count)
        {
            return BadRequest("Existem itens inativos ou inexistentes no pedido.");
        }

        var sale = new Sale
        {
            EmployeeId = employee.Id,
            TotalAmount = request.TotalAmount,
            Status = SaleStatus.PendingLink,
            QrToken = qrTokenService.GenerateToken(),
            ExpiresAtUtc = qrTokenService.GenerateExpirationUtc()
        };

        foreach (var itemRequest in request.Items)
        {
            var product = products.First(x => x.Id == itemRequest.ProductId);
            sale.Items.Add(new SaleItem
            {
                ProductId = product.Id,
                Quantity = itemRequest.Quantity,
                ItemPoints = product.BasePoints * itemRequest.Quantity,
                UnitPriceSnapshot = product.UnitPrice
            });
        }

        dbContext.Sales.Add(sale);
        await dbContext.SaveChangesAsync();

        return Ok(new CreateSaleResponse(sale.Id, sale.QrToken, sale.ExpiresAtUtc));
    }

    [HttpGet]
    public async Task<ActionResult> GetSales([FromQuery] SaleStatus? status = null)
    {
        await ExpirePendingSalesAsync();

        var query = dbContext.Sales
            .Include(x => x.Employee)
            .Include(x => x.Customer)
            .Include(x => x.Items)
            .ThenInclude(x => x.Product)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        var sales = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(100)
            .Select(x => new
            {
                x.Id,
                x.QrToken,
                x.Status,
                x.CreatedAtUtc,
                x.ExpiresAtUtc,
                x.LinkedAtUtc,
                Employee = x.Employee.Name,
                Customer = x.Customer != null ? x.Customer.FullName : null,
                x.TotalAmount,
                x.LinkIpAddress,
                Items = x.Items.Select(i => new
                {
                    i.ProductId,
                    ProductName = i.Product.Name,
                    i.Quantity,
                    i.ItemPoints,
                    i.UnitPriceSnapshot
                })
            })
            .ToListAsync();

        return Ok(sales);
    }

    private async Task ExpirePendingSalesAsync()
    {
        var now = DateTime.UtcNow;
        var expired = await dbContext.Sales
            .Where(x => x.Status == SaleStatus.PendingLink && x.ExpiresAtUtc < now)
            .ToListAsync();

        if (expired.Count == 0)
        {
            return;
        }

        foreach (var sale in expired)
        {
            sale.Status = SaleStatus.Expired;
        }

        await dbContext.SaveChangesAsync();
    }
}
