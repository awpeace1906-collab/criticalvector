import SwiftUI

enum AppTab: Hashable {
    case browse, settings
}

struct ContentView: View {
    @StateObject private var store = DataStore()
    @State private var selection: AppTab = .browse

    var body: some View {
        TabView(selection: $selection) {
            NavigationStack {
                HomeView()
            }
            .tabItem { Label("Browse", systemImage: "square.grid.2x2") }
            .tag(AppTab.browse)

            NavigationStack {
                SettingsView()
                    .navigationTitle("Settings")
                    .navigationBarTitleDisplayMode(.inline)
            }
            .tabItem { Label("Settings", systemImage: "gearshape") }
            .tag(AppTab.settings)
        }
        .tint(Theme.gold)
        .environmentObject(store)
    }
}

#Preview {
    ContentView()
}
