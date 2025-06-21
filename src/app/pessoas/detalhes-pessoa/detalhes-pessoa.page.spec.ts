import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalhesPessoaPage } from './detalhes-pessoa.page';

describe('DetalhesPessoaPage', () => {
  let component: DetalhesPessoaPage;
  let fixture: ComponentFixture<DetalhesPessoaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalhesPessoaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
