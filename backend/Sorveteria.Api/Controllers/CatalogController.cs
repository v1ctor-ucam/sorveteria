using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sorveteria.Api.Data;
using Sorveteria.Api.Domain;
using Sorveteria.Api.Dtos;

namespace Sorveteria.Api.Controllers;

[ApiController]
[Route("api/catalog")]
public class CatalogController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("products")]
    public async Task<ActionResult> GetProducts([FromQuery] bool onlyActive = true)
    {
        var query = dbContext.Products.AsQueryable();
        if (onlyActive)
        {
            query = query.Where(x => x.IsActive);
        }

        var products = await query
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Category,
                x.Description,
                x.IsActive,
                x.CountsForCampaign,
                x.BasePoints,
                x.UnitPrice
            })
            .ToListAsync();

        return Ok(products);
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpPost("products")]
    public async Task<ActionResult> CreateProduct(UpsertProductRequest request)
    {
        var product = new Product
        {
            Name = request.Name,
            Category = request.Category,
            Description = request.Description,
            IsActive = request.IsActive,
            CountsForCampaign = request.CountsForCampaign,
            BasePoints = request.BasePoints,
            UnitPrice = request.UnitPrice
        };

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync();
        return Created($"/api/catalog/products/{product.Id}", product);
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpPut("products/{id:guid}")]
    public async Task<ActionResult> UpdateProduct(Guid id, UpsertProductRequest request)
    {
        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.Id == id);
        if (product is null)
        {
            return NotFound();
        }

        product.Name = request.Name;
        product.Category = request.Category;
        product.Description = request.Description;
        product.IsActive = request.IsActive;
        product.CountsForCampaign = request.CountsForCampaign;
        product.BasePoints = request.BasePoints;
        product.UnitPrice = request.UnitPrice;

        await dbContext.SaveChangesAsync();
        return Ok(product);
    }
}
