# Welcome to iMD👋

iMD was developed so patients could have easy access to simple explanations of their appointments and could send them to their caregivers.

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).
iMD was also developed with [Supabase] (https://supabase.com)

## To run iMD

-- Look at the .env.example file for the basic .env structure (You would need to change these to the proper keys)

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Using iMD - For the Patients

1. Use the Account Sign-in Screen to either make a new account or sign in to an existing one (make sure the Patient toggle is on)
2. Make a new Appointment using the Make Appointment in the Appointments tab
3. Record a conversation for that Appointment in the Recordings tab
4. Upload that Recording to the Storage Bucket on Supabase
5. Transcribe that Recording
6. When Viewing that Transcription, Make a simplified explanation
7. You can add a caregiver relationship by generating a Token from Managing your Caregiver Relationships in the Profile Tab
8. Share that Appointment with your caregiver in the Contacts Tab
9. You can view Appointments (upcoming and past) in the Appointments tab by clicking View Appointment

## Using iMD - For the Caregivers

1. Use the Account Sign-in Screen to either make a new account or sign in to an existing one (make sure the Patient toggle is off)
2. You can View your caregiver Relationships in the Profile Tab
3. You can View appointments shared with you in the Appointments Tab
