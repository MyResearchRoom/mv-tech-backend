const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class ProspectProject extends Model {
        static associate(models) {
            ProspectProject.belongsTo(
                models.Prospect, 
                { foreignKey: 'prospectId', as: 'prospect' });

            ProspectProject.hasMany(models.ProspectTower, {
                foreignKey: 'prospectProjectId', as: 'towers', onDelete: 'CASCADE'
            });
        }
    }

    ProspectProject.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            prospectId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            entityCode:{
                type: DataTypes.STRING(30),
                allowNull: true,
            },
            projectName: {
                type: DataTypes.STRING(200),
                allowNull: true
            },
            projectType: {
                type: DataTypes.STRING(200),
                allowNull: true
            },
            projectStatus: {
                type: DataTypes.STRING,
                allowNull: true
            },
            gstin:{
                type: DataTypes.STRING(15),
                allowNull: true,
            },
            pan:{
                type: DataTypes.STRING(10),
                allowNull: true,
            },           
            projectLocation: {
                type: DataTypes.STRING(200),
                allowNull: true
            },
            city:{
                type: DataTypes.STRING(80),
                allowNull: true,
            },
            state:{
                type: DataTypes.STRING(80),
                allowNull: true,
            },
            pincode:{
                type: DataTypes.STRING(10),
                allowNull: true,
            },
            contactPerson:{
                type: DataTypes.STRING(100),
                allowNull: true,
            },

            status: {
                type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
                allowNull: false,
                defaultValue: 'ACTIVE',
            },

            towerCount: {
                type: DataTypes.INTEGER,
                allowNull: true,
                field: 'towers'
            },
            
            projectDescription: {
                type: DataTypes.TEXT,              
                allowNull: true
            },
            expectedTimeline: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            fireAuthority: {
                type: DataTypes.STRING(150),
                allowNull: true
            },
            fireRequirements: {
                type: DataTypes.TEXT,
                allowNull: true
            }
        },
        {
            sequelize,
            modelName: "ProspectProject",
            tableName: "prospect_projects",
            timestamps: true,
   
        }
    );

    return ProspectProject;
};