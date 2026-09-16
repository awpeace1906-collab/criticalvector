import SwiftUI

struct SectionDetailView: View {
    @EnvironmentObject var store: DataStore
    let sectionID: String

    @State private var webHeight: CGFloat = 200
    @State private var scrollTarget: String?
    @State private var activeSubID: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                if let meta = store.meta(for: sectionID) {
                    header(meta)
                }

                if let navSection = store.navSection(for: sectionID), !navSection.subsections.isEmpty {
                    subnav(navSection.subsections)
                }

                WebContentView(sectionID: sectionID, height: $webHeight, scrollTarget: $scrollTarget)
                    .frame(height: webHeight)
                    .padding(.top, 8)

                if let neighbors = store.neighbors(of: sectionID) {
                    prevNext(neighbors)
                }
            }
            .padding(16)
        }
        .background(Theme.navyBg.ignoresSafeArea())
        .navigationTitle(store.meta(for: sectionID).map { "\($0.num) · \($0.title)" } ?? "Section")
        .navigationBarTitleDisplayMode(.inline)
        .id(sectionID)
    }

    private func header(_ meta: SectionMeta) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .center, spacing: 10) {
                Text(meta.num)
                    .font(.system(size: 12, weight: .heavy))
                    .foregroundColor(Theme.navyDark)
                    .frame(width: 30, height: 30)
                    .background(Circle().fill(Theme.gold))
                Text(meta.title)
                    .font(.system(size: 21, weight: .bold))
                    .foregroundColor(.white)
            }
            if !meta.desc.isEmpty {
                Text(meta.desc)
                    .font(.system(size: 13))
                    .foregroundColor(Theme.textMuted)
                    .padding(.leading, 40)
            }
        }
    }

    private func subnav(_ subs: [NavSubsection]) -> some View {
        FlowLayout(spacing: 6) {
            ForEach(subs) { sub in
                Button {
                    activeSubID = sub.id
                    scrollTarget = sub.id
                } label: {
                    Text(sub.label)
                        .font(.system(size: 12))
                        .foregroundColor(activeSubID == sub.id ? Theme.gold : Theme.textDim)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            Capsule()
                                .fill(activeSubID == sub.id ? Theme.gold.opacity(0.08) : Theme.navyPanel)
                        )
                        .overlay(
                            Capsule().stroke(activeSubID == sub.id ? Theme.gold : Theme.border, lineWidth: 1)
                        )
                }
            }
        }
        .padding(.top, 18)
        .padding(.bottom, 6)
    }

    private func prevNext(_ neighbors: (prev: SectionMeta, next: SectionMeta)) -> some View {
        HStack(spacing: 8) {
            NavigationLink(value: neighbors.prev.id) {
                pnButton(label: "← Previous", title: neighbors.prev.title, alignment: .leading)
            }
            NavigationLink(value: neighbors.next.id) {
                pnButton(label: "Next →", title: neighbors.next.title, alignment: .trailing)
            }
        }
        .padding(.top, 26)
    }

    private func pnButton(label: String, title: String, alignment: HorizontalAlignment) -> some View {
        VStack(alignment: alignment, spacing: 3) {
            Text(label)
                .font(.system(size: 9.5, weight: .bold))
                .foregroundColor(Theme.textMuted)
                .textCase(.uppercase)
            Text(title)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Theme.gold)
                .multilineTextAlignment(alignment == .leading ? .leading : .trailing)
        }
        .frame(maxWidth: .infinity, alignment: alignment == .leading ? .leading : .trailing)
        .padding(12)
        .background(RoundedRectangle(cornerRadius: 8).fill(Theme.navyPanel))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.border, lineWidth: 1))
    }
}

/// Simple wrapping horizontal layout for subsection pills.
struct FlowLayout: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > width, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: width, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x: CGFloat = bounds.minX, y: CGFloat = bounds.minY, rowHeight: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: .unspecified)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
