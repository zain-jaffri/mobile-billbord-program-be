import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../shared/sequelize";
import type { Driver } from "../drivers/driver.model";

export type DriverResponseCountAttributes = {
  responseCountId: number;
  driverId: number;
  year: number;
  month: number;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type DriverResponseCountCreation = Optional<
  DriverResponseCountAttributes,
  "responseCountId" | "createdAt" | "updatedAt"
>;

export class DriverResponseCount
  extends Model<DriverResponseCountAttributes, DriverResponseCountCreation>
  implements DriverResponseCountAttributes
{
  declare responseCountId: number;
  declare driverId: number;
  declare year: number;
  declare month: number;
  declare count: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly Driver?: Driver;
}

DriverResponseCount.init(
  {
    responseCountId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "response_count_id",
    },
    driverId: { type: DataTypes.INTEGER, allowNull: false, field: "driver_id" },
    year: { type: DataTypes.INTEGER, allowNull: false },
    month: { type: DataTypes.INTEGER, allowNull: false },
    count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: "driver_response_counts",
    underscored: true,
    indexes: [{ unique: true, fields: ["driver_id", "year", "month"] }],
  }
);
