import { Request, Response, NextFunction } from 'express';
import { Profile } from './profile.model';

export class ProfileController {
  /**
   * Add a new Profile
   * @route POST /api/profile/addProfile
   */
  public static async addProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileData = req.body?.profileData;
      if (!profileData) {
        res.status(400).json({ message: 'Profile data is required' });
        return;
      }

      const { profileName, totalSteps, steps, alarmDelay } = profileData;
      if (!profileName || !totalSteps || !steps) {
        res.status(400).json({ message: 'All fields required' });
        return;
      }

      const newProfile = new Profile({
        profileName,
        No_Of_Steps: totalSteps,
        steps,
        Alarm_Delay: alarmDelay || 0,
      });

      const savedProfile = await newProfile.save();
      res.status(200).json({ message: savedProfile });
    } catch (error) {
      console.error('Error adding profile:', error);
      res.status(417).json({ message: 'Failed to Add Profile' });
    }
  }

  /**
   * View a single Profile by ID (passed in headers)
   * @route GET /api/profile/viewProfile
   */
  public static async viewProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.headers?.id as string;
      if (!profileId) {
        res.status(400).json({ message: 'Profile ID is required in headers' });
        return;
      }

      const profileData = await Profile.findById(profileId);
      res.status(200).json({ profileData });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(417).json({ message: 'Failed to get Profile data' });
    }
  }

  /**
   * Find Profile suggestions
   * @route GET /api/profile/profileSuggestion
   */
  public static async findProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query.query as string;
      if (!query) {
        res.json({ error: 'Invalid Input' });
        return;
      }

      const newRegex = new RegExp('^' + query, 'i');
      const suggestions = await Profile.find({
        profileName: { $regex: newRegex },
      }).limit(10);

      res.json({ suggestions });
    } catch (error) {
      console.error('Error in profile suggestion:', error);
      res.status(500).json({ error: 'Server Error' });
    }
  }

  /**
   * Update a Profile
   * @route POST /api/profile/updateProfile
   */
  public static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileData = req.body?.profileData;
      if (!profileData) {
        res.status(400).json({ message: 'Profile data is required' });
        return;
      }

      const { profileName, totalSteps, steps, alarmDelay, id } = profileData;
      if (!profileName || !totalSteps || !steps || !alarmDelay || !id) {
        res.status(400).json({ message: 'All fields required' });
        return;
      }

      const updatedProfile = await Profile.findByIdAndUpdate(
        id,
        {
          $set: {
            profileName,
            No_Of_Steps: totalSteps,
            steps,
            Alarm_Delay: alarmDelay,
          },
        },
        { new: true }
      );

      res.status(200).json({ message: updatedProfile });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(417).json({ message: 'Failed to update Profile' });
    }
  }

  /**
   * Delete a Profile (passed in headers)
   * @route DELETE /api/profile/deleteProfile
   */
  public static async deleteProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.headers?.id as string;
      if (!profileId) {
        res.status(400).json({ message: 'Profile ID is required in headers' });
        return;
      }

      const resp = await Profile.deleteOne({ _id: profileId });
      res.status(200).json({ message: resp });
    } catch (error) {
      console.error('Error deleting profile:', error);
      res.status(417).json({ message: 'Failed to delete Profile' });
    }
  }

  /**
   * Get all Profiles
   * @route GET /api/profile/getAllProfile
   */
  public static async getProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const AllProfiles = await Profile.find();
      res.status(200).json({ profiles: AllProfiles });
    } catch (error) {
      console.error('Error getting all profiles:', error);
      res.status(417).json({ message: 'Failed to get Profiles' });
    }
  }

  /**
   * Local service helper to get all profiles list
   */
  public static async getProfilesList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const AllProfiles = await Profile.find();
      res.status(200).json({ profiles: AllProfiles });
    } catch (error) {
      console.error('Error getting profiles list:', error);
      res.status(417).json({ message: 'Failed to get Profiles List' });
    }
  }
}
