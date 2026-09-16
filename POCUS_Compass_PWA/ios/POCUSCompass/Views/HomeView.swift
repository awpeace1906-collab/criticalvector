import SwiftUI

struct HomeView: View {
    @EnvironmentObject var store: DataStore
    @State private var query: String = ""

    private var badges: [(label: String, fg: Color, bg: Color)] {
        [
            ("EM", Theme.em, Theme.emBg),
            ("Critical Care", Theme.cc, Theme.ccBg),
            ("Anesthesia", Theme.anes, Theme.anesBg),
            ("Trauma", Theme.trauma, Theme.traumaBg),
            ("OB", Theme.ob, Theme.obBg),
        ]
    }

    private var filteredGroups: [(group: NavGroup, sections: [NavSection])] {
        guard let manifest = store.manifest else { return [] }
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return manifest.groups.compactMap { group in
            let matched = group.sections.filter { sec in
                if q.isEmpty { return true }
                if sec.title.lowercased().contains(q) { return true }
                return sec.subsections.contains { $0.label.lowercased().contains(q) }
            }
            return matched.isEmpty ? nil : (group, matched)
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                hero

                TextField("", text: $query, prompt: Text("Search sections & topics…").foregroundColor(Theme.textMuted))
                    .foregroundColor(Theme.text)
                    .padding(11)
                    .background(RoundedRectangle(cornerRadius: 8).fill(Theme.navyPanel))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(query.isEmpty ? Theme.border : Theme.gold, lineWidth: 1))
                    .padding(.top, 18)
                    .padding(.bottom, 6)

                if filteredGroups.isEmpty {
                    Text("No sections match \u{201c}\(query)\u{201d}.")
                        .font(.system(size: 13))
                        .foregroundColor(Theme.textMuted)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 24)
                } else {
                    ForEach(filteredGroups, id: \.group.id) { entry in
                        Text(entry.group.label.uppercased())
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Theme.textMuted)
                            .padding(.top, 22)
                            .padding(.bottom, 8)

                        ForEach(entry.sections) { sec in
                            NavigationLink(value: sec.id) {
                                sectionRow(sec)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Theme.navyBg.ignoresSafeArea())
        .navigationTitle("POCUS Field Guide")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: String.self) { sectionID in
            SectionDetailView(sectionID: sectionID)
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("POCUS Field Guide".uppercased())
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(Theme.gold)
            Text("Browse the Guide")
                .font(.system(size: 24, weight: .bold))
                .foregroundColor(.white)
            Text(store.manifest?.subtitle ?? "")
                .font(.system(size: 12.5))
                .foregroundColor(Theme.textMuted)

            FlowLayout(spacing: 6) {
                ForEach(badges, id: \.label) { b in
                    Text(b.label.uppercased())
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(b.fg)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(RoundedRectangle(cornerRadius: 3).fill(b.bg))
                }
            }
            .padding(.top, 10)
        }
    }

    private func sectionRow(_ sec: NavSection) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Text(sec.num)
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundColor(Theme.navyDark)
                    .frame(width: 26, height: 26)
                    .background(Circle().fill(Theme.gold))
                Text(sec.title)
                    .font(.system(size: 14.5, weight: .bold))
                    .foregroundColor(Theme.text)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundColor(Theme.textMuted)
            }
            if !sec.subsections.isEmpty {
                Text(sec.subsections.prefix(6).map(\.label).joined(separator: "  ·  "))
                    .font(.system(size: 11.5))
                    .foregroundColor(Theme.textDim)
                    .padding(.leading, 36)
                    .lineLimit(2)
            }
        }
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 9).fill(Theme.navyPanel))
        .overlay(RoundedRectangle(cornerRadius: 9).stroke(Theme.border, lineWidth: 1))
        .padding(.bottom, 8)
    }
}
