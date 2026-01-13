import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "./sequelize";

export type AppUserAttributes = {
  id: string;
  firebaseUid: string;
  email?: string | null;
  driverId?: number | null;
  role?: "driver" | "fieldWorker" | "admin" | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AppUserCreation = Optional<
  AppUserAttributes,
  "id" | "email" | "driverId" | "role" | "createdAt" | "updatedAt"
>;

export class AppUser extends Model<AppUserAttributes, AppUserCreation> implements AppUserAttributes {
  declare id: string;
  declare firebaseUid: string;
  declare email: string | null;
  declare driverId: number | null;
  declare role: "driver" | "fieldWorker" | "admin" | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AppUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firebaseUid: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      field: "firebase_uid",
    },
    email: { type: DataTypes.STRING(255), allowNull: true },
    driverId: { type: DataTypes.INTEGER, allowNull: true, field: "driver_id" },
    role: {
      type: DataTypes.ENUM("driver", "fieldWorker", "admin"),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: "app_users",
    underscored: true,
    indexes: [{ fields: ["firebase_uid"] }],
  }
);
