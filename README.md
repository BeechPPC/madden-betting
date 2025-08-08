# Madden CFM Betting Platform

A comprehensive betting platform for Madden Connected Franchise Mode (CFM) leagues, featuring AI-powered matchup analysis, real-time leaderboards, and seamless Google Sheets integration.

## Features

### 🏈 Core Betting System
- **Weekly Matchup Predictions**: Users can place bets on weekly Madden CFM games
- **Real-time Leaderboards**: Track user performance and standings
- **Multi-league Support**: Manage multiple leagues with different settings
- **Admin Panel**: Comprehensive league management tools

### 🤖 AI-Powered Matchup Analysis (Premium Feature)
- **Smart Matchup Descriptions**: AI-generated analysis based on team records and performance
- **Dynamic Analysis**: Contextual descriptions that adapt to different matchup scenarios:
  - Evenly matched teams
  - Dominant vs struggling teams
  - Rookie debuts vs veteran teams
  - Close competitive matchups
- **Caching System**: Optimized performance with intelligent caching
- **Refresh Capability**: Users can regenerate fresh AI analysis
- **Fallback Descriptions**: Graceful error handling with intelligent fallbacks

### 📊 Google Sheets Integration
- **Automatic Data Sync**: Real-time synchronization with Google Sheets
- **Flexible Templates**: Customizable sheet templates for different league formats
- **Multi-league Support**: Separate sheets for different leagues
- **Data Validation**: Robust error handling and data validation

### 🔐 Authentication & Security
- **Firebase Authentication**: Secure user authentication
- **Role-based Access**: Admin and user roles with appropriate permissions
- **League-specific Access**: Users can only access their assigned leagues

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Theme**: Eye-friendly dark mode interface
- **Smooth Animations**: Polished user experience with smooth transitions
- **Real-time Updates**: Live updates without page refreshes

## AI Matchup Analysis Features

The AI matchup description system provides intelligent analysis for each matchup:

### Analysis Types
- **Record-based Analysis**: Considers team win/loss records
- **Experience Analysis**: Accounts for teams with different game counts
- **Competitive Analysis**: Identifies close matchups vs lopsided games
- **Contextual Descriptions**: Adapts language based on matchup characteristics

### Premium Benefits
- **AI-Generated Insights**: Get detailed matchup analysis
- **Multiple Description Variants**: Fresh analysis on each generation
- **Performance Optimization**: Cached results for faster loading
- **Error Recovery**: Intelligent fallback descriptions

### Example Descriptions
- "Evenly matched teams in nail-biter"
- "Chiefs heavy favorite against struggling Raiders"
- "Rookie teams clash in season opener"
- "Bills aims to extend hot streak against Patriots"

## Getting Started

### Prerequisites
- Node.js 18+ 
- Firebase project
- Google Sheets API access
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd madden-betting
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your Firebase and Google Sheets credentials
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

### Configuration

1. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Add your Firebase credentials to `.env.local`

2. **Google Sheets Setup**
   - Enable Google Sheets API
   - Create service account credentials
   - Set up sheet templates for your leagues

3. **Vercel Deployment**
   - Connect your repository to Vercel
   - Configure environment variables
   - Deploy the application

## API Endpoints

### Core Endpoints
- `GET /api/getMatchups` - Retrieve current week matchups
- `POST /api/submitBet` - Submit user picks
- `GET /api/getLeaderboard` - Get current standings
- `POST /api/markWinner` - Mark matchup winners (admin)

### AI Analysis Endpoints
- `POST /api/generateMatchupDescription` - Generate AI matchup analysis

### League Management
- `POST /api/createLeague` - Create new league
- `POST /api/joinLeague` - Join existing league
- `GET /api/getUserLeagues` - Get user's leagues

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team. 