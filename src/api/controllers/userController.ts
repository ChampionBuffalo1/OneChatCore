import bcrypt from 'bcrypt';
import User from '../../models/User';
import { isValidUsername } from '../../lib';
import { DatabaseError, IntegrityFailure, InvalidCredential, InvalidUsername } from '../errors';

const createUser = async (username: string, hashPass: string): Promise<string | undefined> => {
  if (!isValidUsername(username)) throw new InvalidUsername(`${username} is not allowed.`);
  try {
    const user = await User.insertOne({
      username,
      passwordHash: hashPass
    });
    return user.insertedId.toString();
  } catch (err) {
    throw new DatabaseError((err as Error).message);
  }
};

const verifyUser = async (username: string, plainPassword: string): Promise<string> => {
  if (!isValidUsername(username)) {
    throw new IntegrityFailure('No user with such username can exist in database.');
  }

  const user = await User.findOne(
    {
      username
    },
    '_id passwordHash'
  );
  if (!user) throw new InvalidCredential('Incorrect username or password');

  const isValidPass = await bcrypt.compare(plainPassword, user.passwordHash);
  if (!isValidPass) throw new InvalidCredential('Incorrect username or Password');
  return user._id.toString();
};
// This method can be removed and the unique functionality can be implemented by hasing username
// and setting _id to be the hash of the username
const hasUsername = async (username: string): Promise<boolean> => {
  if (!isValidUsername(username)) return false;
  const user = await User.exists({
    username
  });
  return user;
};

export { createUser, verifyUser, hasUsername };
