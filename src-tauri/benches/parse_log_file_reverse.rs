use coh3_stats_desktop_app::parse_log_file::parse_log_file_reverse;
use criterion::{criterion_group, criterion_main, Criterion};

fn criterion_benchmark(c: &mut Criterion) {
    c.bench_function("parse_log_file_reverse 2mb", |b| {
        b.iter(|| parse_log_file_reverse("tests/warnings-2mb.log".to_string()))
    });
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
