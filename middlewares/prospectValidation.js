const { body, param, query } = require("express-validator");
const { Prospect, Company } = require("../models");
const { Op } = require("sequelize");

const PROSPECT_TYPES = ["Individual", "Company", "Builder / Developer", "Contractor", "Consultant", "Other"];
const PROJECT_TYPES = ["Residential", "Commercial", "Industrial", "Hospital", "Educational", "Hotel", "Warehouse", "Mixed Use", "Other"];
const PROJECT_STATUSES = ["Concept / Planning", "Under Construction", "Retrofit / Operational"];

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PHONE_REGEX = /^\+?[0-9][0-9\s-]{8,14}$/;

const optional = { checkFalsy: true };

const prospectDetailsRules = [
  body("companyId")
    .notEmpty().withMessage("Company ID is required").bail()
    .isInt({ min: 1 }).withMessage("Invalid company ID").bail()
    .toInt()
    .custom(async (companyId) => {
      const company = await Company.findByPk(companyId, { attributes: ["id"] });
      if (!company) throw new Error("Company not found");
      return true;
    }),

  body("prospectType")
    .trim().notEmpty().withMessage("Prospect type is required").bail(),

  body("companyName")
    .trim().notEmpty().withMessage("Prospect / company name is required").bail()
    .isLength({ max: 150 }).withMessage("Name must be 150 characters or fewer"),

  body("contactPerson")
    .trim().notEmpty().withMessage("Contact person name is required").bail()
    .isLength({ max: 100 }).withMessage("Contact person must be 100 characters or fewer"),

  body("designation").optional(optional).trim().isLength({ max: 100 }),

  body("mobile")
    .trim().notEmpty().withMessage("Mobile number is required").bail()
    .matches(PHONE_REGEX).withMessage("Enter a valid mobile number"),

  body("alternateContact")
    .optional(optional).trim()
    .matches(PHONE_REGEX).withMessage("Enter a valid alternate contact number"),

  body("email")
    .trim().notEmpty().withMessage("Email address is required").bail()
    .isEmail().withMessage("Enter a valid email address").bail()
    .toLowerCase(),

  body("website")
    .optional(optional).trim()
    .isURL({ require_protocol: false }).withMessage("Enter a valid website"),

  body("gstin")
    .optional(optional).trim().toUpperCase()
    .matches(GSTIN_REGEX).withMessage("Enter a valid 15-character GSTIN").bail()
    .custom(async (value, { req }) => {
      const where = { gstin: value };
      if (req.params?.id) where.id = { [Op.ne]: Number(req.params.id) };  
      const exists = await Prospect.findOne({ where, attributes: ["id"] });
      if (exists) throw new Error("A prospect with this GSTIN already exists");
      return true;
    }),

  body("pan")
    .optional(optional).trim().toUpperCase()
    .matches(PAN_REGEX).withMessage("Enter a valid 10-character PAN"),


  body("registeredAddress").optional(optional).trim(),
  body("city").optional(optional).trim().isLength({ max: 80 }),
  body("state").optional(optional).trim().isLength({ max: 80 }),
  body("pinCode")
    .optional(optional).trim()
    .matches(/^[0-9]{6}$/).withMessage("PIN code must be 6 digits"),
  body("country").optional(optional).trim().isLength({ max: 60 }),
  body("remarks").optional(optional).trim(),

  body("builderProjectName").trim().notEmpty().withMessage("Master project name is required").bail(),

  body("builderProjectType").trim().notEmpty().withMessage("Master project type is required").bail(),
];

const prospectProjectRules = [
  body("project.projectName")
    .if((value, { req }) => req.body.project && Object.keys(req.body.project).length > 0)
    .trim()
    .notEmpty().withMessage("Project name is required")
    .bail()
    .isLength({ max: 200 }).withMessage("Project name must be 200 characters or fewer"),

  body("project.projectType")
    .if((value, { req }) => req.body.project && Object.keys(req.body.project).length > 0)
    .trim()
    .notEmpty().withMessage("Project type is required")
    .bail()
    .isLength({ max: 200 }).withMessage("Project type must be 200 characters or fewer"),

  body("project.projectStatus").optional(optional).trim(),

  body("project.gstin")
    .if((value, { req }) => req.body.project && Object.keys(req.body.project).length > 0)
    .trim()
    .notEmpty().withMessage("Project GSTIN is required")
    .bail()
    .toUpperCase()
    .matches(GSTIN_REGEX).withMessage("Enter a valid 15-character project GSTIN"),

  body("project.pan")
    .optional(optional).trim().toUpperCase()
    .matches(PAN_REGEX).withMessage("Enter a valid 10-character project PAN"),
  body("project.projectLocation").optional(optional).trim().isLength({ max: 200 }),
  body("project.city").optional(optional).trim().isLength({ max: 80 }),
  body("project.state").optional(optional).trim().isLength({ max: 80 }),
  body("project.pincode").optional(optional).trim().isLength({ max: 10 }),

  body("project.contactPerson")
    .if((value, { req }) => req.body.project && Object.keys(req.body.project).length > 0)
    .trim()
    .notEmpty().withMessage("Project contact person is required")
    .bail()
    .isLength({ max: 100 }).withMessage("Project contact person must be 100 characters or fewer"),

  body("project.status").optional().isIn(["ACTIVE", "INACTIVE"]),
  body("project.projectDescription").optional(optional).trim(),
  body("project.expectedTimeline").optional(optional).trim().isLength({ max: 100 }),
  body("project.fireAuthority").optional(optional).trim().isLength({ max: 150 }),
  body("project.fireRequirements").optional(optional).trim(),
];

const prospectTowerRules = [
  body("project.towers")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Towers must be a non-empty array."),
  body("project.towers.*.towerName")
    .if((value, { req }) =>
      Array.isArray(req.body.project?.towers) &&
      req.body.project.towers.length > 0
    )
    .trim()
    .notEmpty().withMessage("Tower name is required.")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Tower name must be 100 characters or fewer."),

  body("project.towers.*.occupancy")
    .optional(optional).trim().isLength({ max: 30 }),
  body("project.towers.*.status")
    .optional(optional).trim().isLength({ max: 50 }),
  body("project.towers.*.heightM")
    .optional(optional)
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage("Tower height must be a non-negative number.")
    .toFloat(),
  body("project.towers.*.floors")
    .optional()
    .isInt({ min: 0 }).withMessage("Tower floors must be a non-negative whole number.")
    .toInt(),
  body("project.towers.*.basements")
    .optional()
    .isInt({ min: 0 }).withMessage("Tower basements must be a non-negative whole number.")
    .toInt(),
  body("project.towers.*.podiums")
    .optional()
    .isInt({ min: 0 }).withMessage("Tower podiums must be a non-negative whole number.")
    .toInt(),
  body("project.towers.*.builtUpArea")
    .optional(optional)
    .isFloat({ min: 0, max: 9999999999.99 })
    .withMessage("Tower built-up area must be a non-negative number.")
    .toFloat(),
  body("project.towers.*.floorRecords")
    .optional()
    .isArray()
    .withMessage("Tower floorRecords must be an array."),
  
  body("project.towers.*.floorRecords.*.floorType")
    .optional()
    .isIn(["TYPICAL", "REFUGE", "TERRACE", "SERVICE"])
    .withMessage("Floor type must be TYPICAL, REFUGE, TERRACE or SERVICE. Basement, ground and podium floors are generated automatically."),
    
  body("project.towers.*.floorRecords.*.floorLabel")
    .optional(optional).trim().isLength({ max: 20 })
    .withMessage("Floor label must be 20 characters or fewer."),

  ...["units1Rk", "units1Bhk", "units2Bhk", "units3Bhk", "units4Bhk"].map((field) =>
    body(`project.towers.*.floorRecords.*.${field}`)
      .optional()
      .isInt({ min: 0 }).withMessage(`${field} must be a non-negative whole number.`)
      .toInt()
  ),
];

exports.addProspectProjectTowersRules = [
  body("project.towers")
    .isArray({ min: 1 })
    .withMessage("Towers must be a non-empty array.")
    .bail()
    .custom((towers) => towers.every((tower) =>
      tower &&
      typeof tower === "object" &&
      !Array.isArray(tower) &&
      tower.id === undefined &&
      (!Array.isArray(tower.floorRecords) ||
        tower.floorRecords.every((floor) => floor && floor.id === undefined))
    ))
    .withMessage("Only new towers and floors can be added."),
  ...prospectTowerRules.slice(1),
];

exports.createProspectRules = [
  ...prospectDetailsRules,
  ...prospectProjectRules,
  ...prospectTowerRules,
];

const prospectTowerUpdateRules = [
  body("project.towers")
    .optional()
    .isArray()
    .withMessage("Towers must be an array.")
    .bail()
    .custom((towers) => towers.every((tower) => {
        if (!tower || typeof tower !== "object" || Array.isArray(tower)) return false;
        if (!tower.id && !String(tower.towerName || "").trim()) return false;
        const floorRecords = Array.isArray(tower.floorRecords) ? tower.floorRecords : [];
        return floorRecords.every((floor) => floor && typeof floor === "object" && !Array.isArray(floor));
      }))
      .withMessage("New towers require a name."),
  body("project.towers.*.id")
    .optional()
    .isInt({ min: 1 }).withMessage("Invalid tower ID.")
    .toInt(),
  body("project.towers.*.towerName")
    .optional()
    .trim()
    .notEmpty().withMessage("Tower name cannot be empty.")
    .bail()
    .isLength({ max: 100 }).withMessage("Tower name must be 100 characters or fewer."),
  body("project.towers.*.occupancy")
    .optional(optional).trim().isLength({ max: 30 }),
  body("project.towers.*.status")
    .optional(optional).trim().isLength({ max: 50 }),
  body("project.towers.*.heightM")
    .optional()
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage("Tower height must be a non-negative number.")
    .toFloat(),
  body("project.towers.*.floors")
    .optional()
    .isInt({ min: 0 }).withMessage("Tower floors must be a non-negative whole number.")
    .toInt(),
  body("project.towers.*.basements")
    .optional()
    .isInt({ min: 0 }).withMessage("Tower basements must be a non-negative whole number.")
    .toInt(),
  body("project.towers.*.podiums")
    .optional()
    .isInt({ min: 0 }).withMessage("Tower podiums must be a non-negative whole number.")
    .toInt(),
  body("project.towers.*.builtUpArea")
    .optional()
    .isFloat({ min: 0, max: 9999999999.99 })
    .withMessage("Tower built-up area must be a non-negative number.")
    .toFloat(),
  body("project.towers.*.floorRecords")
    .optional()
    .isArray()
    .withMessage("Tower floorRecords must be an array."),
  body("project.towers.*.floorRecords.*.id")
    .optional()
    .isInt({ min: 1 }).withMessage("Invalid floor ID.")
    .toInt(),
  
  body("project.towers.*.floorRecords.*.floorType")
    .optional()
    .isIn(["TYPICAL", "REFUGE", "TERRACE", "SERVICE"])
    .withMessage("Invalid floor type."),
  body("project.towers.*.floorRecords.*.floorLabel")
    .optional()
    .trim()
    .notEmpty().withMessage("Floor label cannot be empty.")
    .bail()
    .isLength({ max: 20 }).withMessage("Floor label must be 20 characters or fewer."),
  ...["units1Rk", "units1Bhk", "units2Bhk", "units3Bhk", "units4Bhk"].map((field) =>
    body(`project.towers.*.floorRecords.*.${field}`)
      .optional()
      .isInt({ min: 0 }).withMessage(`${field} must be a non-negative whole number.`)
      .toInt()
  ),
];

exports.prospectIdRule = [
  param("id").isInt({ min: 1 }).withMessage("Invalid prospect id").toInt(),
];

exports.prospectProjectIdRule = [
  param("projectId").isInt({ min: 1 }).withMessage("Invalid prospect project id").toInt(),
];

exports.documentOwnerRules = [
  query("ownerId").isInt({ min: 1 }).withMessage("Invalid owner id").toInt(),
  query("ownerType")
    .isIn(["prospect", "client", "project"])
    .withMessage("Owner type must be prospect, client, or project"),
];

exports.companyIdQueryRule = [
  query("companyId")
    .notEmpty().withMessage("Company ID is required").bail()
    .isInt({ min: 1 }).withMessage("Invalid company ID").bail()
    .toInt()
    .custom(async (companyId) => {
      const company = await Company.findByPk(companyId, { attributes: ["id"] });
      if (!company) throw new Error("Company not found");
      return true;
    }),
];

exports.updateProspectRules = [
  ...exports.prospectIdRule,
  ...prospectDetailsRules,
  ...prospectProjectRules,
  ...prospectTowerUpdateRules,
];