"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Form,
  FormField,
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Slider,
  ColorPicker,
  DatePicker,
  SelectField,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Progress,
  ScrollArea,
  Separator,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  toastSuccess
} from "@qp/ui";
import { Save, Palette, Calendar } from "lucide-react";

interface FormData {
  name: string;
  description: string;
  category: string;
  color: string;
  startDate: Date;
  notifications: boolean;
  visibility: string;
  priority: number;
}

export function DemoFormComponents() {
  const [color, setColor] = useState("#3b82f6");
  const [date, setDate] = useState<Date>();
  const [progress, setProgress] = useState(33);

  const form = useForm<FormData>({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      color: "#3b82f6",
      notifications: true,
      visibility: "public",
      priority: 50
    }
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
    toastSuccess("Formulario enviado", {
      description: "Todos los datos han sido guardados correctamente"
    });
  };

  const categoryOptions = [
    { value: "mundial", label: "Mundial" },
    { value: "champions", label: "Champions League" },
    { value: "liga", label: "Liga MX" },
    { value: "copa", label: "Copa América" }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Componentes de Formulario Avanzados</CardTitle>
          <CardDescription>
            Ejemplo completo de todos los componentes de formulario disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Básicos</TabsTrigger>
              <TabsTrigger value="advanced">Avanzados</TabsTrigger>
              <TabsTrigger value="selection">Selección</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Alert variant="info">
                <AlertTitle>Componentes Básicos</AlertTitle>
                <AlertDescription>
                  Input, Textarea, y controles básicos de formulario
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Pool</Label>
                <Input
                  id="name"
                  placeholder="Mundial 2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu quiniela..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="notifications" defaultChecked />
                <Label htmlFor="notifications">
                  Enviar notificaciones por email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms" />
                <Label htmlFor="terms">
                  Acepto los términos y condiciones
                </Label>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Alert variant="success">
                <AlertTitle>Componentes Avanzados</AlertTitle>
                <AlertDescription>
                  ColorPicker, DatePicker, Slider y más
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Color del Pool</Label>
                <ColorPicker
                  value={color}
                  onChange={setColor}
                />
                <div className="flex items-center gap-2">
                  <div
                    className="h-8 w-8 rounded border"
                    style={{ backgroundColor: color }}
                  />
                  <Badge variant="default">{color}</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Fecha de Inicio</Label>
                <DatePicker
                  value={date}
                  onChange={setDate}
                  placeholder="Selecciona la fecha"
                />
                {date && (
                  <Badge variant="info" StartIcon={Calendar}>
                    {date.toLocaleDateString('es-MX')}
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Prioridad: {progress}%</Label>
                  <Badge variant="warning">{progress}%</Badge>
                </div>
                <Slider
                  value={[progress]}
                  onValueChange={(value) => setProgress(value[0])}
                  max={100}
                  step={1}
                />
                <Progress value={progress} className="h-2" />
              </div>
            </TabsContent>

            <TabsContent value="selection" className="space-y-4">
              <Alert variant="warning">
                <AlertTitle>Componentes de Selección</AlertTitle>
                <AlertDescription>
                  Select, RadioGroup, y SelectField avanzado
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría (Select Nativo)</Label>
                <Select>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mundial">Mundial</SelectItem>
                    <SelectItem value="champions">Champions League</SelectItem>
                    <SelectItem value="liga">Liga MX</SelectItem>
                    <SelectItem value="copa">Copa América</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Categoría (React Select)</Label>
                <SelectField
                  options={categoryOptions}
                  placeholder="Selecciona una categoría..."
                  isClearable
                  isSearchable
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Visibilidad</Label>
                <RadioGroup defaultValue="public">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public">Público</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private">Privado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="invite" id="invite" />
                    <Label htmlFor="invite">Solo por invitación</Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="secondary">Cancelar</Button>
          <Button StartIcon={Save}>
            Guardar Configuración
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ScrollArea Demo</CardTitle>
          <CardDescription>
            Área de scroll personalizada con estilos consistentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72 w-full rounded-md border p-4">
            <div className="space-y-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant={i % 3 === 0 ? "success" : i % 3 === 1 ? "warning" : "info"}>
                    Item {i + 1}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Este es un elemento de ejemplo en el ScrollArea #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
