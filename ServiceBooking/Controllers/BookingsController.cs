using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceBooking.Data;
using ServiceBooking.Models;

namespace ServiceBooking.Controllers
{
    [ApiController]
    [Route("api/bookings")]
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookingsController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/bookings
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> BookService(Booking booking)
        {
           
            var service = await _context.Services.FindAsync(booking.ServiceId);
            if (service == null || !service.IsApproved)
            {
                return BadRequest("Service not found or not approved.");
            }

            
            booking.Status = "Pending";
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();
            return Ok(booking);
        }

        // GET: api/bookings/{userId}
        [HttpGet("{userId}")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetBookingHistory(int userId)
        {
            var bookings = await _context.Bookings
                .Where(b => b.UserId == userId)
                .Include(b => b.ServiceId) 
                .ToListAsync();
            return Ok(bookings);
        }

        // GET: api/bookings/pending 
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingBookings()
        {
            var pendingBookings = await _context.Bookings
                .Where(b => b.Status == "Pending")
                .Select(b => new
                {
                    b.Id,
                    b.UserId, 
                    b.ServiceId,
                    b.Status,
                    b.BookingDate
                })
                .ToListAsync();

            return Ok(pendingBookings);
        }

        // PUT: api/bookings/{id} 
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateBookingStatus(int id, [FromBody] string status)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null)
            {
                return NotFound("Booking not found.");
            }

            if (status != "Approved" && status != "Rejected")
            {
                return BadRequest("Invalid status. Use 'Approved' or 'Rejected'.");
            }

            booking.Status = status;
            _context.Bookings.Update(booking);
            await _context.SaveChangesAsync();
            return Ok(booking);
        }
    }
}
