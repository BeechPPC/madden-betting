# Madden CFM Betting App

A full-stack web application for Madden CFM players to log weekly game predictions from matchups listed in a Google Sheet.

## Features

- 🎨 **Modern Landing Page** - Beautiful landing page for new users with features showcase and pricing
- 🔐 Google Authentication with Firebase
- 🏆 **Unique League System** - Each league has a unique ID (XXX-XXX-XXXX format) for easy sharing and joining
- 📊 Fetch matchup data from Google Sheets
- 🎯 Submit weekly picks with user-friendly interface
- 🏆 Live leaderboard showing user rankings
- 📱 Responsive design for mobile and desktop
- ⚡ Real-time updates and modern UI
- 🏈 Team matchup header with logos at the top of the screen
- 📱 Mobile-optimized scrolling for better user experience
- 📋 Copy-to-clipboard functionality for league codes

## Landing Page

The app features a modern, professional landing page that new users see before signing in:

- **Hero Section**: Eye-catching introduction with call-to-action buttons
- **Features Showcase**: Highlights key app features with icons and descriptions
- **Pricing Plans**: Free and Premium tier options
- **Contact Form**: User-friendly contact section
- **Responsive Design**: Optimized for all device sizes
- **Authentication Flow**: Seamless integration with Google Sign-in

The landing page is designed to convert visitors into users while showcasing the app's value proposition.

## Team Matchup Header

The app now features a prominent team matchup header that displays when matchups are available:

- **Desktop**: Shows team logos with "VS" separator at the top of the screen
- **Mobile**: Sticky header with scrollable content below
- **Responsive**: Automatically adapts to different screen sizes
- **Dynamic**: Updates based on the first available matchup from the Google Sheet

The header provides a clear visual indication of the current week's matchups, similar to professional betting applications.

## League System

The app now supports multiple leagues with a unique ID system:

- **Unique League IDs**: Each league gets a unique identifier in the format `XXX-XXX-XXXX` (letters and numbers)
- **Easy Sharing**: League admins can share their league code with friends
- **Simple Joining**: Users can join existing leagues by entering the league code
- **Copy-to-Clipboard**: One-click copying of league codes for easy sharing
- **Format Validation**: Automatic validation of league code format when joining
- **Visual Display**: League codes are prominently displayed in the app header

### League Creation Flow

1. User signs in with Google
2. Chooses "Create New League (Admin)"
3. Enters league name
4. System generates unique league ID
5. Admin can share the code with friends

### League Joining Flow

1. User signs in with Google
2. Chooses "Join Existing League"
3. Enters league code (automatically formatted)
4. System validates code format
5. User joins the league as a regular member

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS
- **Authentication**: Firebase Auth (Google Sign-in)
- **Database**: Supabase (PostgreSQL)
- **External API**: Google Sheets API
- **Deployment**: Vercel (recommended)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd madden-betting
pnpm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (for server-side authentication)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=your_private_key_here

# Google Sheets API Configuration
# Template sheet for creating new league sheets
GOOGLE_SHEET_TEMPLATE_ID=your_template_sheet_id_here
# Legacy single sheet (for backward compatibility)
GOOGLE_SHEET_ID=your_legacy_sheet_id_here
GOOGLE_SHEET_RANGE=Sheet1!A2:E
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your_project_id","private_key_id":"your_private_key_id","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n","client_email":"your_service_account_email@your_project.iam.gserviceaccount.com","client_id":"your_client_id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your_service_account_email%40your_project.iam.gserviceaccount.com"}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### 3. Firebase Setup

Follow the detailed setup guide in [docs/firebase-setup.md](docs/firebase-setup.md) to configure Firebase Authentication and get your credentials.

### 4. Google Sheets Setup

The app now supports multiple leagues, each with their own Google Sheet. Follow the detailed setup guide in [docs/google-sheets-template-setup.md](docs/google-sheets-template-setup.md) to configure the template sheet.

**Quick Setup:**
1. Create a Google Sheet template with the required tabs (Matchups, Bets, Leaderboard, Results)
2. Set up Google Sheets API and Drive API in Google Cloud Console
3. Create a Service Account with appropriate permissions
4. Share the template sheet with the service account
5. Add the template sheet ID to your environment variables

**Key Features:**
- Each league gets its own Google Sheet automatically
- Template-based sheet creation ensures consistency
- Backward compatibility with existing single-sheet setup
- Automatic sheet setup with headers and sample data

### 5. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Create the `bets` table with the following SQL:

```sql
CREATE TABLE bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  user_id TEXT, -- Firebase user ID for authentication
  matchup_id TEXT NOT NULL,
  selected_team TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_bets_user_name ON bets(user_name);
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_created_at ON bets(created_at);
```

3. Get your Supabase URL and service role key from the project settings

### 6. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
madden-betting/
├── components/
│   ├── LandingPage.tsx     # Modern landing page for new users
│   ├── Login.tsx           # Authentication login page
│   ├── UserProfile.tsx     # User profile and sign out
│   ├── MatchupCard.tsx     # Individual matchup display
│   ├── Leaderboard.tsx     # Leaderboard component
│   └── ui/                 # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── input.tsx
│       └── textarea.tsx
├── contexts/
│   └── AuthContext.tsx     # Authentication context
├── lib/
│   └── firebase.ts         # Firebase configuration
├── utils/
│   ├── api.ts              # Authenticated API utilities
│   └── authMiddleware.ts   # Server-side auth middleware
├── pages/
│   ├── api/
│   │   ├── getMatchups.ts  # Google Sheets API
│   │   ├── submitBet.ts    # Supabase bet submission
│   │   └── getLeaderboard.ts # Leaderboard computation
│   ├── _app.tsx           # App wrapper with AuthProvider
│   ├── index.tsx          # Main page with authentication
│   └── login.tsx          # Dedicated login page
├── styles/
│   └── globals.css        # Global styles with TailwindCSS
├── docs/
│   └── firebase-setup.md  # Firebase setup guide
├── package.json
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

## API Endpoints

- `GET /api/getMatchups` - Fetch matchups from Google Sheets
- `POST /api/submitBet` - Submit user picks to Supabase
- `GET /api/getLeaderboard` - Get computed leaderboard

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
pnpm build
pnpm start
```

## Customization

### Adding Result Tracking

To track actual game results and calculate correct picks:

1. Create a `results` table in Supabase
2. Add a `correct` boolean field to the `bets` table
3. Update the leaderboard API to use actual results

### Styling

The app uses TailwindCSS with custom color schemes. Modify `tailwind.config.js` to change the theme.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own Madden CFM league! 