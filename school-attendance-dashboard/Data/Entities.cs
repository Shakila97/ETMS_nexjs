using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SchoolAttendance.Dashboard.Data;

public class School
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public List<ClassRoom> Classes { get; set; } = new();
}

public class ClassRoom
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [ForeignKey(nameof(School))]
    public int SchoolId { get; set; }
    public School? School { get; set; }

    public List<Student> Students { get; set; } = new();
}

public class Student
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [NotMapped]
    public string FullName => string.Concat(FirstName, " ", LastName);

    [ForeignKey(nameof(ClassRoom))]
    public int ClassRoomId { get; set; }
    public ClassRoom? ClassRoom { get; set; }

    public List<AttendanceRecord> AttendanceRecords { get; set; } = new();
}

public class AttendanceRecord
{
    [Key]
    public int Id { get; set; }

    public DateOnly Date { get; set; }

    public bool IsPresent { get; set; }

    [MaxLength(200)]
    public string? Reason { get; set; }

    [ForeignKey(nameof(Student))]
    public int StudentId { get; set; }
    public Student? Student { get; set; }
}
