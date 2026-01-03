import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "./sequelize";

export type UserRole = "driver" | "fieldWorker" | "admin" | null;

export type UserProfileAttributes = {
  userId: string;
  role: UserRole;
  driverId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserProfileCreation = Optional<
  UserProfileAttributes,
  "role" | "driverId" | "createdAt" | "updatedAt"
>;

export class UserProfile
  extends Model<UserProfileAttributes, UserProfileCreation>
  implements UserProfileAttributes
{
  declare userId: string;
  declare role: UserRole;
  declare driverId: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserProfile.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      field: "user_id",
    },
    role: {
      type: DataTypes.ENUM("driver", "fieldWorker", "admin"),
      allowNull: true,
      field: "role",
    },
    driverId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: "driver_id",
    },
  },
  {
    sequelize,
    tableName: "user_profiles",
    underscored: true,
  }
);
