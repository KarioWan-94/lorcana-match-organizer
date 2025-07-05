# Lorcana Match Organizer

一個專為 Disney Lorcana 卡牌遊戲設計的比賽管理系統，支援瑞士制配對、分數管理和詳細的比賽記錄。

## ✨ 主要功能

- 🎯 **瑞士制配對**：自動智能配對，避免重複對戰
- 🔒 **分數鎖定機制**：防止意外修改已確定的比賽結果
- 📊 **詳細計分榜**：支援瑞士制細分排名（OMW%, GW%, OGW%）
- 📝 **歷史紀錄管理**：可修改過往比賽結果和配對
- ✋ **手動配對編輯**：支援手動調整對戰安排
- 💾 **自動儲存**：比賽數據自動保存到本地
- 🎨 **美觀界面**：現代化的用戶介面設計

## 🚀 使用方式

### 🌐 網頁版 (推薦)
**直接在瀏覽器使用，無需下載：**
- 🔗 **[立即使用 - Lorcana 比賽管理系統](https://KarioWan-94.github.io/lorcana-match-organizer)**

### 💻 桌面版下載

**Windows 用戶：**
- [下載安裝版](https://github.com/KarioWan-94/lorcana-match-organizer/releases/latest) - 自動安裝到系統
- [下載攜帶版](https://github.com/KarioWan-94/lorcana-match-organizer/releases/latest) - 無需安裝直接執行

**Mac 用戶：**
- [下載 ARM64 版本 (Apple Silicon)](https://github.com/KarioWan-94/lorcana-match-organizer/releases/latest) - M1/M2 芯片
- [下載 Intel 版本](https://github.com/KarioWan-94/lorcana-match-organizer/releases/latest) - Intel 芯片

### 📱 功能對比

| 功能 | 網頁版 | 桌面版 |
|------|--------|--------|
| 🌐 隨時隨地使用 | ✅ | ❌ |
| 💾 離線使用 | ❌ | ✅ |
| 🔄 自動更新 | ✅ | ❌ |
| 📱 手機平板支援 | ✅ | ❌ |
| 💻 系統整合 | ❌ | ✅ |

## 📖 使用說明

1. **建立比賽**：輸入玩家名稱，點擊「開始比賽」
2. **記錄分數**：在「本輪對戰」分頁中輸入比賽結果
3. **確定結果**：點擊「確定」按鈕鎖定每場比賽結果
4. **進入下一輪**：所有比賽確定後，點擊「下一輪比賽」
5. **查看排名**：在「計分榜」分頁查看即時排名和細分數據

## 🎲 計分規則

- **勝利（2-0）**：7 分
- **勝利（1-0）**：3 分
- **平手（1-1）**：雙方各 3 分
- **輪空**：6 分

## 🏆 瑞士制細分排名

當玩家分數相同時，按以下順序排名：

1. **對手勝率 (OMW%)**：對手的平均勝率
2. **遊戲勝率 (GW%)**：自己的遊戲勝率
3. **對手遊戲勝率 (OGW%)**：對手的平均遊戲勝率

## 🛠 開發環境

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node package manager)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/lorcana-match-organizer.git
   ```
2. Navigate to the project directory:
   ```
   cd lorcana-match-organizer
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application

To start the development server, run:
```
npm start
```
The application will be available at `http://localhost:3000`.

### Building for Production

To create a production build, run:
```
npm run build
```
This will generate a `build` directory with optimized files for deployment.

## Usage

- Navigate to the home page to register players and view the scoreboard.
- Create matches and track scores in real-time.
- Access match details for in-depth information about each match.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.