import { Profile, IProfile } from './profile.model';

export class ProfileService {
  /**
   * Create a new profile in the database
   */
  public static async createProfile(profileData: Partial<IProfile>): Promise<IProfile> {
    const newProfile = new Profile(profileData);
    return await newProfile.save();
  }

  /**
   * Find a profile by ID
   */
  public static async getProfileById(id: string): Promise<IProfile | null> {
    return await Profile.findById(id);
  }

  /**
   * Find profiles whose names start with the query
   */
  public static async findProfilesByNameRegex(query: string, limit: number = 10): Promise<IProfile[]> {
    const regex = new RegExp('^' + query, 'i');
    return await Profile.find({
      profileName: { $regex: regex },
    }).limit(limit);
  }

  /**
   * Update an existing profile by ID
   */
  public static async updateProfile(id: string, updateData: Partial<IProfile>): Promise<IProfile | null> {
    return await Profile.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
  }

  /**
   * Delete a profile by ID
   */
  public static async deleteProfile(id: string): Promise<any> {
    return await Profile.deleteOne({ _id: id });
  }

  /**
   * Fetch all profiles from the database
   */
  public static async getAllProfiles(): Promise<IProfile[]> {
    return await Profile.find();
  }
}
