public class Group extends Clip {

    public Group(String name) {
        super(name);
    }

    public Group(String name, TimeBand band, EndAction end) {
        super(name, band, end);
    }

    public Group(String name, TimeBand band) {
        super(name, band);
    }

    @Override
    public void add(Tween tween) {
        throw new RuntimeException("groups cannot have tweens");
    }

    @Override
    public boolean isGroup() {
        return true;
    }

    @Override
    public double playHead() {
        return parent.playHead();
    }

    protected void tickStep(int step, double oldParentTime, double parentTime) {
        tickStepChildren(step, oldParentTime, parentTime);
    }

}
