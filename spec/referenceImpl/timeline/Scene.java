public class Scene extends Clip {

    private boolean inited = false;

    public Scene(String name, double length) {
        super(name);

        band = new TimeBand(0, length);
    }

    public double duration() {
        return band.length();
    }

    public void maybeInit() {
        if (!inited) {
            inited = true;
            init();
        }
    }

    /**
     * Regular time advance
     */
    public void tick(double delta) {
        int deltaTicks = toTicks(delta);

        int step;
        do {
            // calculate minimum step to not go over timeline action
            step = step(deltaTicks);

            tickStep(step, -1);

        } while ((deltaTicks -= step) > 0);
    }

    @Override
    public String toString() {
        return "scene["+name+"]";
    }
}
