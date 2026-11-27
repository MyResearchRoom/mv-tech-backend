const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProspectEstimation extends Model {
        static associate(models) {
            ProspectEstimation.belongsTo(models.Prospect, { foreignKey: 'prospectId', as: 'prospect' });

            ProspectEstimation.belongsTo(models.ProspectProject, { foreignKey: 'prospectProjectId', as: 'prospectProject' });

            ProspectEstimation.hasMany(models.ProspectEstimationItem, {
                foreignKey: 'estimationId', as: 'items', onDelete: 'CASCADE'
            });
            ProspectEstimation.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
            ProspectEstimation.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });

            ProspectEstimation.belongsTo(ProspectEstimation, { foreignKey: 'copiedFromEstimationId', as: 'previousVersion', constraints: false });
        }
    }

    ProspectEstimation.init(
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },

            prospectId: { type: DataTypes.INTEGER, allowNull: false },

            prospectProjectId: { type: DataTypes.INTEGER, allowNull: false },

            estimationCode: { type: DataTypes.STRING(50), allowNull: false, unique: true }, // EST-PR-MVT-001-V01

            version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
            
            status: {
                type: DataTypes.ENUM('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'SUPERSEDED'),
                allowNull: false, defaultValue: 'DRAFT'
            },
            copiedFromEstimationId: { type: DataTypes.INTEGER, allowNull: true }, // revision / reuse lineage
            sentAt: { type: DataTypes.DATE, allowNull: true },

            totalCost: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
            
            approvedBy: { type: DataTypes.INTEGER, allowNull: true },
            approvedAt: { type: DataTypes.DATE, allowNull: true },
            remarks: { type: DataTypes.TEXT, allowNull: true },
            createdBy: { type: DataTypes.INTEGER, allowNull: true }
        },
        {
            sequelize,
            modelName: 'ProspectEstimation',
            tableName: 'prospect_estimations',
            timestamps: true,
            indexes: [{ unique: true, fields: ['prospectId', 'version'] }]
        }
    );

    return ProspectEstimation;
};