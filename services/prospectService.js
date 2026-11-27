const { Op } = require("sequelize");
const {
  sequelize, Prospect, ProspectProject, ProspectTower, ProspectTowerFloor, Document, ActivityLog,
} = require("../models");

const PREFIX = "PROS-MVT";
const ENTITY_CODE_PREFIX = "ENTITY-PROS";

const nextProspectCode = async (t) => {
  const last = await Prospect.findOne({
    attributes: ["prospectCode"],
    where: {
      prospectCode: {
        [Op.like]: `${PREFIX}-%`,
      },
    },
    order: [
      [
        sequelize.literal(
          "CAST(SUBSTRING_INDEX(prospectCode, '-', -1) AS UNSIGNED)"
        ),
        "DESC",
      ],
    ],
    transaction: t,
    lock: t ? t.LOCK.UPDATE : undefined,
  });

  const lastNumber = last
    ? parseInt(last.prospectCode.split("-").pop(), 10)
    : 0;

  return `${PREFIX}-${String(lastNumber + 1).padStart(3, "0")}`;
};

const nextEntityCode = async (t) => {
  const last = await ProspectProject.findOne({
    attributes: ["entityCode"],
    where: {
      entityCode: {
        [Op.like]: `${ENTITY_CODE_PREFIX}-%`,
      },
    },
    order: [
      [
        sequelize.literal(
          "CAST(SUBSTRING_INDEX(entityCode, '-', -1) AS UNSIGNED)"
        ),
        "DESC",
      ],
    ],
    transaction: t,
    lock: t ? t.LOCK.UPDATE : undefined,
  });

  const lastNumber = last
    ? parseInt(last.entityCode.split("-").pop(), 10)
    : 0;

  return `${ENTITY_CODE_PREFIX}-${String(lastNumber + 1).padStart(2, "0")}`;
};

const httpError = (status, message) => Object.assign(new Error(message), { status });

const pickFields = (source, fields) =>
  fields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(source, field)) result[field] = source[field];
    return result;
  }, {});

const PROJECT_FIELDS = [
  "projectName", "projectType", "projectStatus", "gstin", "pan",
  "projectLocation", "city", "state", "pincode", "contactPerson", "status",
  "expectedTimeline", "fireAuthority", "fireRequirements", "projectDescription",
];
const TOWER_FIELDS = [
  "towerName", "occupancy", "status", "heightM", "floors",
  "basements", "podiums", "builtUpArea",
];
const UNIT_FIELDS = ["units1Rk", "units1Bhk", "units2Bhk", "units3Bhk", "units4Bhk"];
const FLOOR_FIELDS = ["floorType", "floorLabel", ...UNIT_FIELDS];
const STRUCTURAL_FLOOR_TYPES = ["BASEMENT", "GROUND", "PODIUM"];

const floorLabelFor = (floorNo, floorType) => {
  switch (floorType) {
    case "REFUGE":  return `R${floorNo}`;
    case "TERRACE": return `T${floorNo}`;
    case "SERVICE": return `S${floorNo}`;
    default:        return String(floorNo);
  }
};

const buildStructuralFloors = ({ basements, podiums }) => {
  const basementCount = Number(basements) || 0;
  const podiumCount = Number(podiums) || 0;
  const floors = [];

  for (let i = basementCount; i >= 1; i--) {
    floors.push({ floorNo: -i, floorLabel: `B${i}`, floorType: "BASEMENT" });
  }
  floors.push({ floorNo: 0, floorLabel: "G", floorType: "GROUND" });
  for (let i = 1; i <= podiumCount; i++) {
    floors.push({ floorNo: i, floorLabel: `P${i}`, floorType: "PODIUM" });
  }
  return floors;
};

const ensureStructuralFloors = async (towerRecord, transaction) => {
  const existing = await ProspectTowerFloor.findAll({
    where: { towerId: towerRecord.id },
    attributes: ["floorNo", "floorLabel", "floorType"],
    transaction,
  });
  const existingLabels = new Set(existing.map((f) => f.floorLabel));

  const missing = buildStructuralFloors(towerRecord)
    .filter((f) => !existingLabels.has(f.floorLabel));


  const needsPodium = missing.some((f) => f.floorType === "PODIUM");
  const hasUpperFloors = existing.some((f) => !STRUCTURAL_FLOOR_TYPES.includes(f.floorType));
  if (needsPodium && hasUpperFloors) {
    throw httpError(409, "Podium levels cannot be added after upper floors exist.");
  }

  if (missing.length) {
    await ProspectTowerFloor.bulkCreate(
      missing.map((f) => ({ ...f, towerId: towerRecord.id })),
      { transaction }
    );
  }
};

const appendUpperFloors = async (towerRecord, clientFloors, transaction) => {
  const upper = clientFloors.filter((f) => !STRUCTURAL_FLOOR_TYPES.includes(f.floorType));
  if (!upper.length) return 0;

  const lastFloorNo = Number(
    await ProspectTowerFloor.max("floorNo", { where: { towerId: towerRecord.id }, transaction })
  );
  let floorNo = Number.isFinite(lastFloorNo) ? lastFloorNo : 0;

  const rows = upper.map((floor) => {
    floorNo += 1;
    const floorType = floor.floorType || "TYPICAL";
    return {
      ...pickFields(floor, UNIT_FIELDS),
      towerId: towerRecord.id,
      floorNo,
      floorType,
      floorLabel: floor.floorLabel || floorLabelFor(floorNo, floorType),
    };
  });

  await ProspectTowerFloor.bulkCreate(rows, { transaction });
  return rows.length;
};

const upsertTowerDetails = async (projectRecord, towers, transaction) => {
  for (const tower of towers) {
    const { id: towerId, floorRecords = [], ...towerDetails } = tower;
    const towerValues = pickFields(towerDetails, TOWER_FIELDS);
    const existingFloors = floorRecords.filter((f) => f.id !== undefined);
    const newFloors = floorRecords.filter((f) => f.id === undefined);
    let towerRecord;

    if (towerId !== undefined) {
      towerRecord = await ProspectTower.findOne({
        where: { id: towerId, prospectProjectId: projectRecord.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!towerRecord) throw httpError(404, "Tower not found for this prospect project");

      towerRecord.set(towerValues);
      await towerRecord.save({ transaction });
    } else {
      towerRecord = await ProspectTower.create(
        { ...towerValues, prospectProjectId: projectRecord.id },
        { transaction }
      );
    }

    await ensureStructuralFloors(towerRecord, transaction);

    for (const { id: floorId, ...floorDetails } of existingFloors) {
      const floorRecord = await ProspectTowerFloor.findOne({
        where: { id: floorId, towerId: towerRecord.id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!floorRecord) throw httpError(404, "Floor not found for this tower");

      floorRecord.set(pickFields(floorDetails, FLOOR_FIELDS));
      await floorRecord.save({ transaction });
    }

    
    const added = await appendUpperFloors(towerRecord, newFloors, transaction);

   
    if (towerValues.floors === undefined && (towerId === undefined || added)) {
      towerRecord.floors = await ProspectTowerFloor.count({
        where: {
          towerId: towerRecord.id,
          floorType: { [Op.notIn]: STRUCTURAL_FLOOR_TYPES },
        },
        transaction,
      });
      await towerRecord.save({ transaction, fields: ["floors"] });
    }
  }

  return ProspectTower.count({
    where: { prospectProjectId: projectRecord.id },
    transaction,
  });
};

// const upsertTowerDetails = async (projectRecord, towers, transaction) => {
//   for (const tower of towers) {
//     const { id: towerId, floorRecords = [], ...towerDetails } = tower;
//     const towerValues = pickFields(towerDetails, TOWER_FIELDS);
//     let towerRecord;

//     if (towerId !== undefined) {
//       towerRecord = await ProspectTower.findOne({
//         where: { id: towerId, prospectProjectId: projectRecord.id },
//         transaction,
//         lock: transaction.LOCK.UPDATE,
//       });
//       if (!towerRecord) throw httpError(404, "Tower not found for this prospect project");

//       towerRecord.set(towerValues);
//       await towerRecord.save({ transaction });
//     } else {
//       towerRecord = await ProspectTower.create(
//         {
//           ...towerValues,
//           floors: towerValues.floors ?? floorRecords.length,
//           prospectProjectId: projectRecord.id,
//         },
//         { transaction }
//       );
//     }

//     for (const floor of floorRecords) {
//       const { id: floorId, ...floorDetails } = floor;
//       const floorValues = pickFields(floorDetails, FLOOR_FIELDS);

//       if (floorId !== undefined) {
//         const floorRecord = await ProspectTowerFloor.findOne({
//           where: { id: floorId, towerId: towerRecord.id },
//           transaction,
//           lock: transaction.LOCK.UPDATE,
//         });
//         if (!floorRecord) throw httpError(404, "Floor not found for this tower");

//         floorRecord.set(floorValues);
//         await floorRecord.save({ transaction });
//       } else {
//         await ProspectTowerFloor.create(
//           { ...floorValues, towerId: towerRecord.id },
//           { transaction }
//         );
//       }
//     }

//     if (floorRecords.length && towerValues.floors === undefined) {
//       towerRecord.floors = await ProspectTowerFloor.count({
//         where: { towerId: towerRecord.id },
//         transaction,
//       });
//       await towerRecord.save({ transaction, fields: ["floors"] });
//     }
//   }

//   return ProspectTower.count({
//     where: { prospectProjectId: projectRecord.id },
//     transaction,
//   });
// };

const createInTransaction = ({ prospect, project = {}, files }, user) =>
  sequelize.transaction(async (t) => {
    const prospectCode = await nextProspectCode(t);

    const created = await Prospect.create(
      { ...prospect, prospectCode, status: "PROSPECT_CREATED", createdBy: user.id },
      { transaction: t }
    );

    if (Object.keys(project).length) {
      const { towers = [], ...projectDetails } = project;
      const entityCode = await nextEntityCode(t);
      const projectRecord = await ProspectProject.create(
        {
          ...pickFields(projectDetails, PROJECT_FIELDS),
          entityCode,
          towerCount: towers.length,
          prospectId: created.id,
        },
        { transaction: t }
      );

      await upsertTowerDetails(projectRecord, towers, t);
    }

    const versionByName = {};
    for (const file of files) {
      versionByName[file.originalname] = (versionByName[file.originalname] || 0) + 1;

      await Document.create(
        {
          ownerType: "prospect",
          ownerId: created.id,
          category: "Drawing",
          fileName: file.originalname,
          version: versionByName[file.originalname],
          document: file.buffer,
          documentContentType: file.mimetype,
          uploadedBy: user.id,
        },
        { transaction: t }
      );
    }

    await ActivityLog.create(
      {
        entityType: "prospect",
        entityId: created.id,
        action: "CREATED",
        details: files.length ? `Prospect created with ${files.length} document(s)` : "Prospect created",
      },
      { transaction: t }
    );

    return created.id;
});

const isCodeCollision = (err) => err.name === "SequelizeUniqueConstraintError" &&
  Object.keys(err.fields || {}).some((k) => k.includes("prospectCode"));

exports.createProspect = async ({ prospect, project, files = [] }, user) => {
  const MAX_ATTEMPTS = 3;

  for (let attempt = 1; ; attempt++) {
    try {
      return await createInTransaction({ prospect, project, files }, user);
    } catch (err) {
      if (!isCodeCollision(err) || attempt === MAX_ATTEMPTS) throw err;
    }
  }
};

exports.getProspectById = (id) =>
    Prospect.findByPk(id, {
        include: [
        { association: "creator", attributes: ["id", "name"] },
        {
          association: "project",
          include: [{
            association: "towers",
            include: [{ association: "floorRecords" }],
          }],
        },
        {
            association: "documents",
            attributes: { exclude: ["document"] },
        },
        ],
    });

exports.getDocumentsByOwner = (
  ownerId,
  ownerType,
  { limit, offset, isAll, searchTerm }
) => {
  const queryOptions = {
    where: {
      ownerType,
      ownerId,
    },
    attributes: {
      exclude: ["document"],
    },
    include: [
      {
        association: "uploader",
        attributes: ["id", "name"],
      
      },
    ],
    order: [["createdAt", "DESC"]],
    distinct: true,
  };

  if (searchTerm) {
    queryOptions.where[Op.or] = [
      { category: { [Op.like]: `%${searchTerm}%` } },
      { fileName: { [Op.like]: `%${searchTerm}%` } },
      { remarks: { [Op.like]: `%${searchTerm}%` } },
      
    ];
  }

  if (!isAll) {
    queryOptions.limit = limit;
    queryOptions.offset = offset;
  }

  return Document.findAndCountAll(queryOptions);
};

exports.uploadProspectDrawings = async (id, files, user) =>
  sequelize.transaction(async (t) => {
    const prospect = await Prospect.findByPk(id, {
      attributes: ["id", "status", "convertedClientId"],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!prospect) throw httpError(404, "Prospect not found.");
    if (prospect.status === "CONVERTED" || prospect.convertedClientId) {
      throw httpError(409, "A converted prospect is read-only. Its documents cannot be uploaded.");
    }

    const existingDocuments = await Document.findAll({
      where: { ownerType: "prospect", ownerId: id },
      attributes: ["fileName", "version"],
      transaction: t,
    });
    const latestVersionByName = new Map();
    for (const document of existingDocuments) {
      latestVersionByName.set(
        document.fileName,
        Math.max(latestVersionByName.get(document.fileName) || 0, document.version)
      );
    }

    const createdDocuments = [];
    for (const file of files) {
      const version = (latestVersionByName.get(file.originalname) || 0) + 1;
      latestVersionByName.set(file.originalname, version);

      createdDocuments.push(await Document.create(
        {
          ownerType: "prospect",
          ownerId: id,
          category: "Drawing",
          fileName: file.originalname,
          version,
          document: file.buffer,
          documentContentType: file.mimetype,
          uploadedBy: user.id,
        },
        { transaction: t }
      ));
    }

    if (files.length) {
      prospect.status = "DRAWINGS_UPLODED";
      await prospect.save({ transaction: t });
    }

    await ActivityLog.create(
      {
        entityType: "prospect",
        entityId: id,
        action: "DOCUMENT_UPLOADED",
        details: `${files.length} drawing document(s) uploaded`,
      },
      { transaction: t }
    );

    return createdDocuments;
  });

exports.updateProspect = async (id, { prospect, project = {}, files = [] }, user) =>
  sequelize.transaction(async (t) => {
    const record = await Prospect.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!record) throw httpError(404, "Prospect not found");
    if (record.status === "CONVERTED" || record.convertedClientId) {
      throw httpError(409, "A converted prospect is read-only and cannot be edited");
    }

    const changes = [];

    record.set(prospect);
    changes.push(...(record.changed() || []));
    await record.save({ transaction: t });

    

    if (Object.keys(project).length) {
      const { towers = [], ...projectDetails } = project;
      const projectValues = pickFields(projectDetails, PROJECT_FIELDS);
      let projectRecord = await ProspectProject.findOne({
        where: { prospectId: id },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!projectRecord && (
        towers.length ||
        Object.values(projectValues).some((value) => value !== null && value !== undefined)
      )) {
        const entityCode = await nextEntityCode(t);
        projectRecord = await ProspectProject.create(
          {
            ...projectValues,
            entityCode,
            towerCount: 0,
            prospectId: id,
          },
          { transaction: t }
        );
        changes.push("project added");
      } else if (projectRecord) {
        projectRecord.set(projectValues);
        const projectChanges = projectRecord.changed() || [];
        if (projectChanges.length) {
          changes.push(...projectChanges.map((field) => `project.${field}`));
          await projectRecord.save({ transaction: t });
        }
      }

      if (projectRecord && towers.length) {
        const towerCount = await upsertTowerDetails(projectRecord, towers, t);
        if (projectRecord.towerCount !== towerCount) {
          projectRecord.towerCount = towerCount;
          await projectRecord.save({ transaction: t, fields: ["towerCount"] });
        }
        changes.push("project towers and floors updated");
      }
    }

    if (files.length) {

      const versionByName = {};
      for (const file of files) {
        versionByName[file.originalname] = (versionByName[file.originalname] || 0) + 1;

        await Document.create(
          {
            ownerType: "prospect",
            ownerId: id,
            category: "Drawing",
            fileName: file.originalname,
            version: versionByName[file.originalname],   
            document: file.buffer,
            documentContentType: file.mimetype,
            uploadedBy: user.id,
          },
          { transaction: t }
        );
      }
    }

    const parts = [];
    if (changes.length) parts.push(`Updated: ${changes.join(", ")}`);
    if (files.length) parts.push(`documents ${files.length} added)`);

    if (parts.length) {
      await ActivityLog.create(
        {
          entityType: "prospect",
          entityId: id,
          action: "UPDATED",
          details: parts.join("; ").slice(0, 500),
        },
        { transaction: t }
      );
    }

    return id;
  });

exports.addTowersToProspectProject = async (projectId, towers) =>
  sequelize.transaction(async (t) => {
    const projectRecord = await ProspectProject.findByPk(projectId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!projectRecord) throw httpError(404, "Prospect project not found.");

    const prospect = await Prospect.findByPk(projectRecord.prospectId, {
      attributes: ["id", "status", "convertedClientId"],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (prospect?.status === "CONVERTED" || prospect?.convertedClientId) {
      throw httpError(409, "A converted prospect is read-only and cannot be edited.");
    }

    if (towers.some((tower) =>
      tower.id !== undefined ||
      (tower.floorRecords || []).some((floor) => floor.id !== undefined)
    )) {
      throw httpError(400, "Only new towers and floors can be added.");
    }

    const towerCount = await upsertTowerDetails(projectRecord, towers, t);
    projectRecord.towerCount = towerCount;
    await projectRecord.save({ transaction: t, fields: ["towerCount"] });

    return ProspectTower.findAll({
      where: { prospectProjectId: projectRecord.id },
      order: [["id", "ASC"]],
      transaction: t,
    });
  });

exports.httpError = httpError;