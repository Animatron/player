public class Scene extends Clip {

    public Scene(String name, double length) {
        super(name);

        band = new TimeBand(0, length);
    }

    public double duration() {
        return band.length();
    }

    @Override
    public String toString() {
        return "scene["+name+"]";
    }
}
