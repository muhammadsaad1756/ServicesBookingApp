using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceBooking.Data;
using ServiceBooking.Models;

[ApiController]
[Route("api/services")]
public class ServicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ServicesController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/services
    [HttpGet]
    public async Task<IActionResult> GetServices()
    {
        var services = await _context.Services
            .Where(s => s.IsApproved) 
            .ToListAsync();
        return Ok(services);
    }

    // POST: api/services 
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddService(Service service)
    {
        service.IsApproved = true;
        _context.Services.Add(service);
        await _context.SaveChangesAsync();
        return Ok(service);
    }

    [HttpGet("{id}")]
    public IActionResult GetServiceById(int id)
    {
        var service = _context.Services.FirstOrDefault(s => s.Id == id);
        if (service == null)
        {
            return NotFound(new { message = "Service not found" });
        }
        return Ok(service);
    }


    // PUT: api/services/{id} 
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateServiceStatus(int id, [FromBody] bool isApproved)
    {
        var service = await _context.Services.FindAsync(id);
        if (service == null)
        {
            return NotFound("Service not found.");
        }

        service.IsApproved = isApproved;
        _context.Services.Update(service);
        await _context.SaveChangesAsync();
        return Ok(service);
    }
}