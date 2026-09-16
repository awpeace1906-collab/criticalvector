import SwiftUI

struct SettingsView: View {
    private var versionString: String {
        let shortVersion = Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
        let build = Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "1"
        return "Version \(shortVersion) (\(build))"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                aboutHeader

                callout(
                    title: "ABOUT",
                    text: "POCUS Field Guide is an interactive point-of-care ultrasound reference spanning physics & knobology, cardiac, thoracic, abdominal, hemodynamics, OB/pelvic, procedures, airway, and more \u{2014} built for emergency medicine, critical care, and anesthesiology. Browse by section or search any topic, fully offline."
                )

                callout(
                    title: "DISCLAIMER",
                    text: "This app is an educational quick-reference tool, not a substitute for clinical training, judgment, or institutional protocol. Always verify values and techniques independently before applying them to patient care."
                )

                Text(versionString)
                    .font(.system(size: 11.5))
                    .foregroundColor(Theme.textMuted)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, 4)

                Text("Part of the Critical Vector clinical reference suite.")
                    .font(.system(size: 11))
                    .foregroundColor(Theme.textMuted)
                    .frame(maxWidth: .infinity, alignment: .center)
            }
            .padding()
        }
        .background(Theme.navyBg.ignoresSafeArea())
    }

    private var aboutHeader: some View {
        VStack(spacing: 8) {
            Text("\u{1F9ED}")
                .font(.system(size: 44))
            Text("POCUS Field Guide")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(.white)
            Text("Your bearing through every window.")
                .font(.system(size: 12.5))
                .foregroundColor(Theme.textMuted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }

    private func callout(title: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 10, weight: .heavy))
                .tracking(1.2)
                .foregroundColor(Theme.gold)
            Text(text)
                .font(.system(size: 13))
                .foregroundColor(Theme.text)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.navyPanel))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
    }
}

#Preview {
    NavigationStack {
        SettingsView()
    }
}
