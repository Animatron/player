public class Movie {

    private Clip globalClip = new Clip("$");

    public Movie addScene(Scene scene) {
        double duration = duration();
        globalClip.addChild(scene);
        scene.band = new TimeBand(duration, duration+scene.band.length());
        return this;
    }

    public double playHead() {
        Scene scene = getCurrentScene();
        return getStartOf(scene) + scene.playHead();
    }

    public double duration() {
        double duration = 0;
        for (Element child : globalClip.children) {
            duration += ((Scene)child).duration();
        }
        return duration;
    }

    private double getStartOf(Scene scene) {
        double duration = 0;
        for (Element child : globalClip.children) {
            if (scene == child) break;
            duration += ((Scene)child).duration();
        }
        return duration;
    }

    public boolean isVisible(Element element) {
        return getCurrentScene().isVisible(element);
    }

    public void tick(double delta) {
        globalClip.tick(delta);
    }

    public Scene getCurrentScene() {
        double time = globalClip.playHead();

        java.util.List<Element> children = globalClip.children;
        for (int i = 0; i < children.size(); i++) {
            Element child = children.get(i);
            if (child.band.containsOpen(time) || (time <= child.band.end && i==children.size()-1)) {
                return (Scene) child;
            }
        }

        return null;
    }
}
