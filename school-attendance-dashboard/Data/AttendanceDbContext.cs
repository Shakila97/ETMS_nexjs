using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace SchoolAttendance.Dashboard.Data;

public class AttendanceDbContext : DbContext
{
    public AttendanceDbContext(DbContextOptions<AttendanceDbContext> options) : base(options)
    {
    }

    public DbSet<School> Schools => Set<School>();
    public DbSet<ClassRoom> Classes => Set<ClassRoom>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var dateOnlyConverter = new ValueConverter<DateOnly, string>(
            v => v.ToString("yyyy-MM-dd"),
            v => DateOnly.Parse(v));

        modelBuilder.Entity<AttendanceRecord>()
            .Property(p => p.Date)
            .HasConversion(dateOnlyConverter);

        modelBuilder.Entity<School>()
            .HasMany(s => s.Classes)
            .WithOne(c => c.School!)
            .HasForeignKey(c => c.SchoolId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ClassRoom>()
            .HasMany(c => c.Students)
            .WithOne(s => s.ClassRoom!)
            .HasForeignKey(s => s.ClassRoomId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Student>()
            .HasMany(s => s.AttendanceRecords)
            .WithOne(a => a.Student!)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
