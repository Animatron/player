import java.util.ArrayList;
import java.util.List;

public class Movie {

    private List<Scene> scenes = new ArrayList<>();
    private Scene current;

    public Movie addScene(Scene scene) {
        scenes.add(scene);
        return this;
    }

    public double playHead() {
        Scene scene = getCurrentScene();
        return getStartOf(scene) + scene.playHead();
    }

    public double duration() {
        double duration = 0;
        for (Scene child : scenes) {
            duration += child.duration();
        }
        return duration;
    }

    private double getStartOf(Scene scene) {
        double duration = 0;
        for (Scene child : scenes) {
            if (scene == child) break;
            duration += child.duration();
        }
        return duration;
    }

    public boolean isVisible(Element element) {
        return getCurrentScene().isVisible(element);
    }

    public void tick(double delta) {
        if (current==null) {
            current = scenes.get(0);
            current.maybeInit();
        }

        double playhead = current.playHead();
        double duration = current.duration();

        if (playhead+delta<=duration) {
            current.tick(delta);
        } else {
            double thisDelta = duration - playhead;
            if (thisDelta!=0) {
                current.tick(thisDelta);
            }
            current = scenes.get((scenes.indexOf(current)+1));
            current.maybeInit();
            current.tick(delta-thisDelta);
        }
    }

    public Scene getCurrentScene() {
        return current;
    }
}
