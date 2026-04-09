import WidgetKit
import SwiftUI

struct WortKriegEntry: TimelineEntry {
    let date: Date
    let german: String
    let turkish: String
    let streak: Int
    let xp: Int
    let challengeSummary: String
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WortKriegEntry {
        WortKriegEntry(date: Date(), german: "der Hund", turkish: "kopek", streak: 6, xp: 1240, challengeSummary: "3/5")
    }

    func getSnapshot(in context: Context, completion: @escaping (WortKriegEntry) -> Void) {
        completion(placeholder(in: context))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WortKriegEntry>) -> Void) {
        let entry = placeholder(in: context)
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

struct WortKriegWidgetView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(entry.german).font(.headline)
            Text(entry.turkish).font(.caption)
            Text("🔥 \(entry.streak)   XP \(entry.xp)").font(.caption2)
            Text("Challenge \(entry.challengeSummary)").font(.caption2)
        }
        .padding()
    }
}

struct WortKriegWidget: Widget {
    let kind: String = "WortKriegWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WortKriegWidgetView(entry: entry)
        }
        .configurationDisplayName("WortKrieg")
        .description("Gunun kelimesi, streak ve challenge durumu.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
