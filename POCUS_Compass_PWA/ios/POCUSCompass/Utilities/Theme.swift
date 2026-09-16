import SwiftUI

enum Theme {
    static let navyBg = Color(hex: "#0d1b2e")
    static let navyDark = Color(hex: "#0a1525")
    static let navyPanel = Color(hex: "#0f2035")
    static let gold = Color(hex: "#c9a84c")
    static let text = Color(hex: "#d4dbe8")
    static let textDim = Color(hex: "#7a98b8")
    static let textMuted = Color(hex: "#4a6a8a")
    static let border = Color(hex: "#1e3354")

    static let em = Color(hex: "#5bafd6")
    static let emBg = Color(hex: "#1a3a5c")
    static let cc = Color(hex: "#9b77d4")
    static let ccBg = Color(hex: "#2a1a3c")
    static let anes = Color(hex: "#6abf6a")
    static let anesBg = Color(hex: "#1a2e1a")
    static let trauma = Color(hex: "#d46a6a")
    static let traumaBg = Color(hex: "#3c1a1a")
    static let ob = Color(hex: "#d4a06a")
    static let obBg = Color(hex: "#3c2a1a")
}

extension Color {
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        s = s.replacingOccurrences(of: "#", with: "")
        var rgb: UInt64 = 0
        Scanner(string: s).scanHexInt64(&rgb)
        let r = Double((rgb & 0xFF0000) >> 16) / 255
        let g = Double((rgb & 0x00FF00) >> 8) / 255
        let b = Double(rgb & 0x0000FF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
