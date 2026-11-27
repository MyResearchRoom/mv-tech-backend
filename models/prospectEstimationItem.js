const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProspectEstimationItem extends Model {
        static associate(models) {
            ProspectEstimationItem.belongsTo(models.ProspectEstimation, { foreignKey: 'estimationId', as: 'estimation' });
            ProspectEstimationItem.belongsTo(models.ProspectTower, { foreignKey: 'towerId', as: 'tower', constraints: false });
            ProspectEstimationItem.belongsTo(models.InventoryItem, { foreignKey: 'itemId', as: 'inventryItem', constraints: false });
        }
    }

    ProspectEstimationItem.init(
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            estimationId: { type: DataTypes.INTEGER, allowNull: false },
            towerId: { type: DataTypes.INTEGER, allowNull: true },    
                    // null = project-wide
  
            itemId: { type: DataTypes.INTEGER, allowNull: true },             // item master; null = 


            itemCode: { type: DataTypes.STRING(50), allowNull: true },
            itemName: { type: DataTypes.STRING(200), allowNull: false },
            brand: { type: DataTypes.STRING(100), allowNull: true },
            unit: { type: DataTypes.STRING(20), allowNull: false },

            quantity: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
            unitCost: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
            totalCost: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 }, // set by service

            source: {type: DataTypes.STRING(200), allowNull: true,},
            remarks: { type: DataTypes.STRING(255), allowNull: true },  // "As per drawing"
          
        },
        {
            sequelize,
            modelName: 'ProspectEstimationItem',
            tableName: 'prospect_estimation_items',
            timestamps: true,
            indexes: [{ fields: ['estimationId'] }, { fields: ['towerId'] }]
        }
    );

    return ProspectEstimationItem;
};