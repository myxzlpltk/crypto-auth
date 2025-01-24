import sequelize from "@/core/db";
import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
} from "sequelize";

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare address: string;
  declare nonce: string;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    address: {
      type: DataTypes.STRING,
      unique: true,
    },
    nonce: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    tableName: "users",
  }
);

export default User;
