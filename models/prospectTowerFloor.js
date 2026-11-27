const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProspectTowerFloor extends Model {
        static associate(models) {
            ProspectTowerFloor.belongsTo(models.ProspectTower, {
                foreignKey: 'towerId', as: 'tower'
            });
        }
    }

    ProspectTowerFloor.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            towerId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
           
            floorNo: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            floorType: {
                type: DataTypes.ENUM('BASEMENT', 'PODIUM', 'GROUND', 'TYPICAL', 'REFUGE', 'TERRACE', 'SERVICE'),
                allowNull: false,
                defaultValue: 'TYPICAL'
            },
           
            floorLabel: {
                type: DataTypes.STRING(20),
                allowNull: false
            },
            
            units1Rk:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            units1Bhk: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            units2Bhk: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            units3Bhk: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            units4Bhk: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
        },
        {
            sequelize,
            modelName: "ProspectTowerFloor",
            tableName: "prospect_tower_floors",
            timestamps: true,
            indexes: [
                { unique: true, fields: ['towerId', 'floorLabel'] },
                { fields: ['towerId', 'floorNo'] }
            ]
        }
    );

    return ProspectTowerFloor;
};