package com.wortkrieg.widget

import androidx.compose.runtime.Composable
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.layout.Column
import androidx.glance.layout.padding
import androidx.glance.text.Text
import androidx.glance.unit.ColorProvider
import androidx.glance.unit.dp

class WortKriegWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: android.content.Context, id: androidx.glance.appwidget.GlanceId) {
        provideContent {
            WortKriegWidgetContent(
                german = "der Hund",
                turkish = "kopek",
                streak = 6,
                xp = 1240,
                challenge = "3/5"
            )
        }
    }
}

@Composable
private fun WortKriegWidgetContent(
    german: String,
    turkish: String,
    streak: Int,
    xp: Int,
    challenge: String
) {
    Column(modifier = GlanceModifier.padding(16.dp)) {
        Text(text = german)
        Text(text = turkish)
        Text(text = "Streak $streak")
        Text(text = "XP $xp")
        Text(text = "Challenge $challenge")
    }
}
