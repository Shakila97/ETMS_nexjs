const express = require("express")
const Project = require("../models/Project")
const Employee = require("../models/Employee")
const { auth } = require("../middleware/auth")
const { adminOrManager } = require("../middleware/roleAuth")
const router = express.Router()

// @route   POST /api/projects
// @desc    Create new project
// @access  Private (Admin/Manager)
router.post("/", auth, adminOrManager, async (req, res) => {
    try {
        const { name, description, manager, status, startDate, endDate, teamMembers } = req.body

        // Verify manager exists
        if (manager) {
            const managerExists = await Employee.findById(manager)
            if (!managerExists) {
                return res.status(400).json({
                    success: false,
                    message: "Manager not found",
                })
            }
        }

        const project = new Project({
            name,
            description,
            manager,
            status: status || "planning",
            startDate,
            endDate,
            teamMembers: teamMembers || [],
        })

        await project.save()
        await project.populate("manager", "firstName lastName employeeId")
        await project.populate("teamMembers", "firstName lastName employeeId")

        res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: { project },
        })
    } catch (error) {
        console.error("Create project error:", error)
        res.status(500).json({
            success: false,
            message: "Server error",
        })
    }
})

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
router.get("/", auth, async (req, res) => {
    try {
        const projects = await Project.find()
            .populate("manager", "firstName lastName employeeId")
            .populate("teamMembers", "firstName lastName employeeId")
            .sort({ createdAt: -1 })

        res.json({
            success: true,
            data: { projects },
        })
    } catch (error) {
        console.error("Get projects error:", error)
        res.status(500).json({
            success: false,
            message: "Server error",
        })
    }
})

// @route   GET /api/projects/:id
// @desc    Get single project
// @access  Private
router.get("/:id", auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate("manager", "firstName lastName employeeId")
            .populate("teamMembers", "firstName lastName employeeId")

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            })
        }

        res.json({
            success: true,
            data: { project },
        })
    } catch (error) {
        console.error("Get project error:", error)
        res.status(500).json({
            success: false,
            message: "Server error",
        })
    }
})

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Admin/Manager)
router.put("/:id", auth, adminOrManager, async (req, res) => {
    try {
        const { name, description, manager, status, startDate, endDate, teamMembers, progress } = req.body

        const project = await Project.findById(req.params.id)
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            })
        }

        if (name) project.name = name
        if (description) project.description = description
        if (status) project.status = status
        if (startDate) project.startDate = startDate
        if (endDate) project.endDate = endDate
        if (progress !== undefined) project.progress = progress

        if (manager) {
            const managerExists = await Employee.findById(manager)
            if (!managerExists) {
                return res.status(400).json({ success: false, message: "Manager not found" })
            }
            project.manager = manager
        }

        if (teamMembers) {
            // Optionally verify all team members exist
            project.teamMembers = teamMembers
        }

        await project.save()
        await project.populate("manager", "firstName lastName employeeId")
        await project.populate("teamMembers", "firstName lastName employeeId")

        res.json({
            success: true,
            message: "Project updated successfully",
            data: { project },
        })
    } catch (error) {
        console.error("Update project error:", error)
        res.status(500).json({
            success: false,
            message: "Server error",
        })
    }
})

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (Admin/Manager)
router.delete("/:id", auth, adminOrManager, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            })
        }

        await Project.findByIdAndDelete(req.params.id)

        res.json({
            success: true,
            message: "Project deleted successfully",
        })
    } catch (error) {
        console.error("Delete project error:", error)
        res.status(500).json({
            success: false,
            message: "Server error",
        })
    }
})

module.exports = router
