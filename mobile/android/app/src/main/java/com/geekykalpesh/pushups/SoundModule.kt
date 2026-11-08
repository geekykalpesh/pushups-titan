package com.geekykalpesh.pushups

import android.media.AudioAttributes
import android.media.SoundPool
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SoundModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var soundPool: SoundPool? = null
    private val soundMap = HashMap<String, Int>()

    init {
        try {
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build()

            soundPool = SoundPool.Builder()
                .setMaxStreams(8)
                .setAudioAttributes(audioAttributes)
                .build()

            loadSound("rep_punch", R.raw.rep_punch)
            loadSound("egg_power", R.raw.egg_power)
            loadSound("goal_fanfare", R.raw.goal_fanfare)
            loadSound("ui_tap", R.raw.ui_tap)
            loadSound("calendar_select", R.raw.calendar_select)
            loadSound("streak_fire", R.raw.streak_fire)
        } catch (e: Exception) {
            Log.e("SoundModule", "Failed to init SoundPool", e)
        }
    }

    private fun loadSound(key: String, resId: Int) {
        try {
            soundPool?.let { pool ->
                val soundId = pool.load(reactContext, resId, 1)
                soundMap[key] = soundId
            }
        } catch (e: Exception) {
            Log.e("SoundModule", "Failed to load sound $key", e)
        }
    }

    override fun getName(): String = "TitanSound"

    @ReactMethod
    fun play(key: String) {
        try {
            val soundId = soundMap[key]
            if (soundId != null && soundId > 0) {
                soundPool?.play(soundId, 0.8f, 0.8f, 1, 0, 1.0f)
            }
        } catch (e: Exception) {
            Log.e("SoundModule", "Error playing sound $key", e)
        }
    }
}
