const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProspectTower extends Model {
        static associate(models) {
            ProspectTower.belongsTo(models.ProspectProject, {
                foreignKey: 'prospectProjectId', as: 'prospectProject'
            });

            ProspectTower.hasMany(models.ProspectTowerFloor, {
                foreignKey: 'towerId', as: 'floorRecords', onDelete: 'CASCADE'
            });
        }
    }

    ProspectTower.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            prospectProjectId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            towerName: {
                type: DataTypes.STRING(100),
                allowNull: false
            },
           
            occupancy: {
                type: DataTypes.STRING(30),
                allowNull: true
            },
            
            status: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            heightM: {
                type: DataTypes.DECIMAL(8, 2),
                allowNull: true
            },
            floors: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            basements: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            podiums: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            builtUpArea: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true
            },

        },
        {
            sequelize,
            modelName: "ProspectTower",
            tableName: "prospect_towers",
            timestamps: true,
            indexes: [
                { fields: ['prospectProjectId'] },
                { unique: true, fields: ['prospectProjectId', 'towerName'] }
            ]
        }
    );

    return ProspectTower;
};