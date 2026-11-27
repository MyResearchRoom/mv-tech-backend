const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProspectEstimationTower extends Model {
        static associate(models) {
            ProspectEstimationTower.belongsTo(models.ProspectEstimation, {
                foreignKey: 'estimationId', as: 'estimation', onDelete: 'CASCADE'
            });
            ProspectEstimationTower.belongsTo(models.ProspectTower, {
                foreignKey: 'towerId', as: 'tower'
            });
        }
    }

    ProspectEstimationTower.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            estimationId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            towerId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            remarks: {
                type: DataTypes.STRING(255),   
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: 'ProspectEstimationTower',
            tableName: 'prospect_estimation_towers',
            timestamps: true,
            indexes: [
                { unique: true, fields: ['estimationId', 'towerId'] },
                { fields: ['towerId'] }
            ]
        }
    );

    return ProspectEstimationTower;
};