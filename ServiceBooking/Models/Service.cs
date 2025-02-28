namespace ServiceBooking.Models
{
    public class Service
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public int Duration { get; set; } // Duration in minutes
        public bool IsApproved { get; set; } 
    }
}
